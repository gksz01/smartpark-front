import { randomUUID } from 'node:crypto'
import { Router, type Request, type Response } from 'express'
import { FEATURE_LABELS, isTenantId, PAYMENT_METHODS, TENANTS } from '../../src/core/config'
import type { PaymentMethod, PaymentStatus, TenantId } from '../../src/core/types'
import type { Atendimento } from '../../src/domain/Atendimento'
import { Pagamento } from '../../src/domain/Pagamento'
import type { EstrategiaPagamento } from '../../src/domain/strategies/pagamento/EstrategiaPagamento'
import { CRIAR_ESTRATEGIA_PAGAMENTO } from '../../src/domain/strategies/pagamento/estrategiaPorForma'
import { TarifaComConvenio } from '../../src/domain/strategies/tarifa/TarifaComConvenio'
import { Tarifa } from '../../src/domain/Tarifa'
import type { Banco } from '../database/conexao'
import { paraAtendimento, paraConvenio, type LinhaAtendimento, type LinhaConvenio } from './convenios'
import { paraTarifa, type LinhaTarifa } from './tarifas'

/** Linha da tabela pagamentos já com veículo, atendimento e convênio (JOIN). */
interface LinhaPagamento {
  id: number
  tenant_id: string
  veiculo_id: number
  reserva_id: number | null
  atendimento_id: number | null
  duracao_horas: number
  valor_tarifa: number
  valor: number
  valor_cobrado: number
  forma: PaymentMethod
  parcelas: number
  detalhe: string
  status: PaymentStatus
  comprovante: string
  criado_em: string
  placa: string
  apelido: string
  numero_atendimento: string | null
  nome_convenio: string | null
}

const SELECT_PAGAMENTO = `
  SELECT p.*, v.placa, v.apelido, a.numero AS numero_atendimento, c.nome AS nome_convenio
  FROM pagamentos p
  JOIN veiculos v ON v.id = p.veiculo_id
  LEFT JOIN atendimentos a ON a.id = p.atendimento_id
  LEFT JOIN convenios c ON c.id = a.convenio_id
`

/** Linha do banco → Pagamento do domínio, com a Strategy da forma gravada e o resultado já processado. */
function paraPagamento(linha: LinhaPagamento): Pagamento {
  const estrategia = CRIAR_ESTRATEGIA_PAGAMENTO[linha.forma](linha.parcelas)
  const pagamento = new Pagamento(String(linha.id), linha.valor, estrategia, String(linha.veiculo_id), linha.reserva_id ? String(linha.reserva_id) : undefined, new Date(linha.criado_em))
  pagamento.status = linha.status
  pagamento.valorCobrado = linha.valor_cobrado
  pagamento.detalhe = linha.detalhe
  pagamento.comprovante = linha.comprovante // o comprovante gravado nunca é gerado de novo
  return pagamento
}

/** Pagamento → formato Payment do frontend (core/types.ts). */
function paraJson(pagamento: Pagamento, linha: LinhaPagamento) {
  return {
    id: pagamento.id,
    vehicleId: pagamento.veiculoId,
    vehicleLabel: `${linha.apelido} · ${linha.placa}`,
    reservationId: pagamento.reservaId ?? null,
    attendanceNumber: linha.numero_atendimento,
    agreementName: linha.nome_convenio,
    duration: linha.duracao_horas,
    tariffAmount: linha.valor_tarifa,
    amount: pagamento.valor,
    chargedAmount: pagamento.valorCobrado,
    method: pagamento.forma,
    installments: linha.parcelas,
    detail: pagamento.detalhe,
    status: pagamento.status,
    receipt: pagamento.comprovante,
    createdAt: pagamento.criadoEm.toISOString(),
  }
}

function buscarPagamento(db: Banco, id: string | number, tenant: TenantId): LinhaPagamento | undefined {
  return db.prepare(`${SELECT_PAGAMENTO} WHERE p.id = ? AND p.tenant_id = ?`).get(id, tenant) as LinhaPagamento | undefined
}

/** Todo pedido precisa de um tenant válido E com a feature billing ligada. */
function lerTenantComCobranca(req: Request, res: Response): TenantId | null {
  const tenant = req.query.tenant
  if (typeof tenant !== 'string' || !isTenantId(tenant)) {
    res.status(400).json({ erro: 'Informe um tenant válido em ?tenant=' })
    return null
  }
  if (!TENANTS[tenant].features.billing) {
    res.status(403).json({ erro: `O módulo ${FEATURE_LABELS.billing} não está disponível para ${TENANTS[tenant].name}.` })
    return null
  }
  return tenant
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

/** Regras do domínio (Pagamento, Atendimento) viram 409; o índice único do banco também. */
function responderConflito(res: Response, falha: unknown): void {
  if (falha instanceof Error && 'code' in falha) {
    if (falha.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw falha
    res.status(409).json({ erro: 'Este atendimento já foi usado em outro pagamento.' })
    return
  }
  res.status(409).json({ erro: (falha as Error).message })
}

export function criarRotasPagamentos(db: Banco): Router {
  const rotas = Router()

  // READ — histórico de pagamentos do tenant
  rotas.get('/', (req, res) => {
    const tenant = lerTenantComCobranca(req, res)
    if (!tenant) return
    const linhas = db.prepare(`${SELECT_PAGAMENTO} WHERE p.tenant_id = ? ORDER BY p.criado_em DESC, p.id DESC`).all(tenant) as LinhaPagamento[]
    res.json(linhas.map((linha) => paraJson(paraPagamento(linha), linha)))
  })

  // CREATE — Tarifa (Strategy) → [TarifaComConvenio] → Pagamento (Strategy) → processar() → SQLite
  rotas.post('/', (req, res) => {
    const tenant = lerTenantComCobranca(req, res)
    if (!tenant) return
    const corpo = req.body ?? {}

    // 1. Dados do formulário (o valor NUNCA vem do navegador)
    const duracao = corpo.duration
    if (typeof duracao !== 'number' || !Number.isInteger(duracao) || duracao < 1 || duracao > 24) {
      res.status(400).json({ erro: 'A duração deve ser um número inteiro de 1 a 24 horas.' })
      return
    }
    const forma = texto(corpo.method) as PaymentMethod
    if (!PAYMENT_METHODS.includes(forma)) {
      res.status(400).json({ erro: `Forma de pagamento inválida. Use: ${PAYMENT_METHODS.join(', ')}.` })
      return
    }
    const parcelas = forma === 'Crédito' ? corpo.installments : 1
    if (typeof parcelas !== 'number' || !Number.isInteger(parcelas)) {
      res.status(400).json({ erro: 'Informe o número de parcelas.' })
      return
    }
    let estrategiaPagamento: EstrategiaPagamento
    try {
      estrategiaPagamento = CRIAR_ESTRATEGIA_PAGAMENTO[forma](parcelas) // PagamentoCredito valida o limite de parcelas
    } catch (falha) {
      res.status(400).json({ erro: (falha as Error).message })
      return
    }

    // 2. Veículo (e reserva opcional) precisam ser DESTE tenant
    const veiculo = db.prepare('SELECT id FROM veiculos WHERE id = ? AND tenant_id = ?').get(corpo.vehicleId, tenant) as { id: number } | undefined
    if (!veiculo) {
      res.status(400).json({ erro: 'Veículo não encontrado neste cliente.' })
      return
    }
    let reservaId: number | null = null
    if (corpo.reservationId) {
      const reserva = db.prepare('SELECT id, veiculo_id FROM reservas WHERE id = ? AND tenant_id = ?').get(corpo.reservationId, tenant) as { id: number; veiculo_id: number } | undefined
      if (!reserva) {
        res.status(400).json({ erro: 'Reserva não encontrada neste cliente.' })
        return
      }
      if (reserva.veiculo_id !== veiculo.id) {
        res.status(400).json({ erro: 'A reserva informada é de outro veículo.' })
        return
      }
      reservaId = reserva.id
    }

    // 3. Tarifa ativa → Tarifa + Strategy (etapa de Tarifas)
    const linhaTarifa = db.prepare('SELECT * FROM tarifas WHERE tenant_id = ? AND ativa = 1').get(tenant) as LinhaTarifa | undefined
    if (!linhaTarifa) {
      res.status(409).json({ erro: 'Não há tarifa ativa neste cliente. Ative uma tarifa antes de cobrar.' })
      return
    }
    const tarifa = paraTarifa(linhaTarifa)
    let tarifaAPagar = tarifa

    // 4. Convênio (só com medicalAgreement): Atendimento → Convenio → TarifaComConvenio
    let atendimento: Atendimento | null = null
    let linhaAtendimento: LinhaAtendimento | undefined
    const numero = texto(corpo.attendanceNumber).toUpperCase()
    if (numero) {
      if (!TENANTS[tenant].features.medicalAgreement) {
        res.status(400).json({ erro: `${FEATURE_LABELS.medicalAgreement} não está disponível para ${TENANTS[tenant].name}.` })
        return
      }
      linhaAtendimento = db.prepare('SELECT * FROM atendimentos WHERE tenant_id = ? AND numero = ?').get(tenant, numero) as LinhaAtendimento | undefined
      if (!linhaAtendimento) {
        res.status(404).json({ erro: 'Atendimento não localizado.' })
        return
      }
      const linhaConvenio = db.prepare('SELECT * FROM convenios WHERE id = ? AND tenant_id = ?').get(linhaAtendimento.convenio_id, tenant) as LinhaConvenio
      const convenio = paraConvenio(linhaConvenio)
      atendimento = paraAtendimento(linhaAtendimento, convenio)
      if (!atendimento.validarElegibilidade()) {
        res.status(409).json({ erro: atendimento.motivoInelegibilidade() })
        return
      }
      // A Strategy do convênio é composta sobre a Strategy da tarifa ativa
      tarifaAPagar = new Tarifa(tarifa.id, `${tarifa.nome} + ${convenio.nome}`, new TarifaComConvenio(tarifa.estrategia, convenio))
    }

    const valorTarifa = tarifa.calcular(duracao)
    const valor = tarifaAPagar.calcular(duracao)

    // 5. Pagamento + consumo do benefício + INSERT: tudo ou nada (transação SQLite)
    const pagar = db.transaction(() => {
      const pagamento = new Pagamento(randomUUID(), valor, estrategiaPagamento, String(veiculo.id), reservaId ? String(reservaId) : undefined)
      pagamento.processar() // a Strategy calcula valor cobrado, detalhe e prefixo do comprovante

      if (atendimento && linhaAtendimento) {
        atendimento.aplicarBeneficio() // a classe Atendimento recusa benefício já usado
        const consumo = db.prepare('UPDATE atendimentos SET beneficio_aplicado = 1 WHERE id = ? AND tenant_id = ? AND beneficio_aplicado = 0')
          .run(linhaAtendimento.id, tenant)
        if (consumo.changes !== 1) throw new Error('O benefício deste atendimento já foi utilizado.')
      }

      return db.prepare(`
        INSERT INTO pagamentos (tenant_id, veiculo_id, reserva_id, atendimento_id, duracao_horas, valor_tarifa, valor, valor_cobrado, forma, parcelas, detalhe, status, comprovante, criado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(tenant, veiculo.id, reservaId, linhaAtendimento?.id ?? null, duracao, valorTarifa, pagamento.valor, pagamento.valorCobrado,
        pagamento.forma, parcelas, pagamento.detalhe, pagamento.status, pagamento.comprovante, pagamento.criadoEm.toISOString()).lastInsertRowid
    })

    try {
      const id = pagar()
      const linha = buscarPagamento(db, Number(id), tenant)!
      res.status(201).json(paraJson(paraPagamento(linha), linha))
    } catch (falha) {
      responderConflito(res, falha)
    }
  })

  // UPDATE — estorno pelo domínio (o benefício do convênio NÃO é devolvido)
  rotas.put('/:id/refund', (req, res) => {
    const tenant = lerTenantComCobranca(req, res)
    if (!tenant) return
    const linha = buscarPagamento(db, req.params.id, tenant)
    if (!linha) {
      res.status(404).json({ erro: 'Pagamento não encontrado.' })
      return
    }
    const pagamento = paraPagamento(linha)
    try {
      pagamento.estornar() // só pagamentos aprovados
    } catch (falha) {
      res.status(409).json({ erro: (falha as Error).message })
      return
    }
    db.prepare('UPDATE pagamentos SET status = ? WHERE id = ? AND tenant_id = ?').run(pagamento.status, linha.id, tenant)
    const atualizado = buscarPagamento(db, linha.id, tenant)!
    res.json(paraJson(paraPagamento(atualizado), atualizado))
  })

  // DELETE — só pagamentos estornados
  rotas.delete('/:id', (req, res) => {
    const tenant = lerTenantComCobranca(req, res)
    if (!tenant) return
    const linha = buscarPagamento(db, req.params.id, tenant)
    if (!linha) {
      res.status(404).json({ erro: 'Pagamento não encontrado.' })
      return
    }
    if (paraPagamento(linha).status !== 'estornado') {
      res.status(409).json({ erro: 'Somente pagamentos estornados podem ser excluídos. Estorne o pagamento antes.' })
      return
    }
    db.prepare('DELETE FROM pagamentos WHERE id = ? AND tenant_id = ?').run(linha.id, tenant)
    res.status(204).end()
  })

  return rotas
}
