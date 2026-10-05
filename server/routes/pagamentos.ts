import { randomUUID } from 'node:crypto'
import { Router, type Response } from 'express'
import { FEATURE_LABELS, PAYMENT_METHODS, TENANTS } from '../../src/core/config'
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
import { enviarErro, erroSqlite, lerTenant, texto } from './comum'

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



/** Regras do domínio (Pagamento, Atendimento) viram 409; o índice único do banco também. */
function responderConflito(res: Response, falha: unknown): void {
  if (falha instanceof Error && 'code' in falha) {
    if (!erroSqlite(falha, 'UNIQUE')) throw falha
    res.status(409).json({ erro: 'Este atendimento já foi usado em outro pagamento.' })
    return
  }
  res.status(409).json({ erro: (falha as Error).message })
}

export function criarRotasPagamentos(db: Banco): Router {
  const rotas = Router()

  // READ — histórico de pagamentos do tenant
  rotas.get('/', (req, res) => {
    const tenant = lerTenant(req, res, 'billing')
    if (!tenant) return
    const linhas = db.prepare(`${SELECT_PAGAMENTO} WHERE p.tenant_id = ? ORDER BY p.criado_em DESC, p.id DESC`).all(tenant) as LinhaPagamento[]
    res.json(linhas.map((linha) => paraJson(paraPagamento(linha), linha)))
  })

  // CREATE — Tarifa (Strategy) → [TarifaComConvenio] → Pagamento (Strategy) → processar() → SQLite
  rotas.post('/', (req, res) => {
    const tenant = lerTenant(req, res, 'billing')
    if (!tenant) return
    const corpo = req.body ?? {}

    // 1. Dados do formulário (o valor NUNCA vem do navegador)
    const duracao = corpo.duration
    if (typeof duracao !== 'number' || !Number.isInteger(duracao) || duracao < 1 || duracao > 24) return enviarErro(res, 400, 'A duração deve ser um número inteiro de 1 a 24 horas.')
    const forma = texto(corpo.method) as PaymentMethod
    if (!PAYMENT_METHODS.includes(forma)) return enviarErro(res, 400, `Forma de pagamento inválida. Use: ${PAYMENT_METHODS.join(', ')}.`)
    const parcelas = forma === 'Crédito' ? corpo.installments : 1
    if (typeof parcelas !== 'number' || !Number.isInteger(parcelas)) return enviarErro(res, 400, 'Informe o número de parcelas.')
    let estrategiaPagamento: EstrategiaPagamento
    try {
      estrategiaPagamento = CRIAR_ESTRATEGIA_PAGAMENTO[forma](parcelas) // PagamentoCredito valida o limite de parcelas
    } catch (falha) {
      res.status(400).json({ erro: (falha as Error).message })
      return
    }

    // 2. Veículo (e reserva opcional) precisam ser DESTE tenant
    const veiculo = db.prepare('SELECT id FROM veiculos WHERE id = ? AND tenant_id = ?').get(corpo.vehicleId, tenant) as { id: number } | undefined
    if (!veiculo) return enviarErro(res, 400, 'Veículo não encontrado neste cliente.')
    let reservaId: number | null = null
    if (corpo.reservationId) {
      const reserva = db.prepare('SELECT id, veiculo_id FROM reservas WHERE id = ? AND tenant_id = ?').get(corpo.reservationId, tenant) as { id: number; veiculo_id: number } | undefined
      if (!reserva) return enviarErro(res, 400, 'Reserva não encontrada neste cliente.')
      if (reserva.veiculo_id !== veiculo.id) return enviarErro(res, 400, 'A reserva informada é de outro veículo.')
      reservaId = reserva.id
    }

    // 3. Tarifa ativa → Tarifa + Strategy (etapa de Tarifas)
    const linhaTarifa = db.prepare('SELECT * FROM tarifas WHERE tenant_id = ? AND ativa = 1').get(tenant) as LinhaTarifa | undefined
    if (!linhaTarifa) return enviarErro(res, 409, 'Não há tarifa ativa neste cliente. Ative uma tarifa antes de cobrar.')
    const tarifa = paraTarifa(linhaTarifa)
    let tarifaAPagar = tarifa

    // 4. Convênio (só com medicalAgreement): Atendimento → Convenio → TarifaComConvenio
    let atendimento: Atendimento | null = null
    let linhaAtendimento: LinhaAtendimento | undefined
    const numero = texto(corpo.attendanceNumber).toUpperCase()
    if (numero) {
      if (!TENANTS[tenant].features.medicalAgreement) return enviarErro(res, 400, `${FEATURE_LABELS.medicalAgreement} não está disponível para ${TENANTS[tenant].name}.`)
      linhaAtendimento = db.prepare('SELECT * FROM atendimentos WHERE tenant_id = ? AND numero = ?').get(tenant, numero) as LinhaAtendimento | undefined
      if (!linhaAtendimento) return enviarErro(res, 404, 'Atendimento não localizado.')
      const linhaConvenio = db.prepare('SELECT * FROM convenios WHERE id = ? AND tenant_id = ?').get(linhaAtendimento.convenio_id, tenant) as LinhaConvenio
      const convenio = paraConvenio(linhaConvenio)
      atendimento = paraAtendimento(linhaAtendimento, convenio)
      if (!atendimento.validarElegibilidade()) return enviarErro(res, 409, atendimento.motivoInelegibilidade())
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
    const tenant = lerTenant(req, res, 'billing')
    if (!tenant) return
    const linha = buscarPagamento(db, req.params.id, tenant)
    if (!linha) return enviarErro(res, 404, 'Pagamento não encontrado.')
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
    const tenant = lerTenant(req, res, 'billing')
    if (!tenant) return
    const linha = buscarPagamento(db, req.params.id, tenant)
    if (!linha) return enviarErro(res, 404, 'Pagamento não encontrado.')
    if (paraPagamento(linha).status !== 'estornado') return enviarErro(res, 409, 'Somente pagamentos estornados podem ser excluídos. Estorne o pagamento antes.')
    db.prepare('DELETE FROM pagamentos WHERE id = ? AND tenant_id = ?').run(linha.id, tenant)
    res.status(204).end()
  })

  return rotas
}
