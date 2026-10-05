import { Router, type Request, type Response } from 'express'
import { BENEFIT_TYPE_LABELS, BENEFIT_TYPES, FEATURE_LABELS, isTenantId, TENANTS } from '../../src/core/config'
import type { BenefitType, TenantId } from '../../src/core/types'
import { Atendimento } from '../../src/domain/Atendimento'
import { Convenio } from '../../src/domain/Convenio'
import type { Banco } from '../database/conexao'

/** Linha da tabela convenios (com a contagem de atendimentos vinculados). */
interface LinhaConvenio {
  id: number
  tenant_id: string
  nome: string
  tipo_beneficio: BenefitType
  valor_beneficio: number
  ativo: number // 0 ou 1
  total_atendimentos?: number
}

/** Linha da tabela atendimentos. */
interface LinhaAtendimento {
  id: number
  tenant_id: string
  convenio_id: number
  numero: string
  paciente: string
  data_atendimento: string // ISO 8601
  beneficio_aplicado: number // 0 ou 1
}

const SELECT_CONVENIO = `
  SELECT c.*, (SELECT COUNT(*) FROM atendimentos a WHERE a.convenio_id = c.id) AS total_atendimentos
  FROM convenios c
`

/** Linha do banco → objeto Convenio do domínio. */
function paraConvenio(linha: LinhaConvenio): Convenio {
  return new Convenio(String(linha.id), linha.nome, linha.tipo_beneficio, linha.valor_beneficio, linha.ativo === 1)
}

/** Linha do banco → objeto Atendimento do domínio, com o estado do benefício já gravado. */
function paraAtendimento(linha: LinhaAtendimento, convenio: Convenio): Atendimento {
  const atendimento = new Atendimento(String(linha.id), linha.numero, linha.paciente, convenio, new Date(linha.data_atendimento))
  atendimento.beneficioAplicado = linha.beneficio_aplicado === 1
  return atendimento
}

/** Convenio → formato Agreement do frontend (core/types.ts). */
function paraJson(convenio: Convenio, totalAtendimentos: number) {
  return {
    id: convenio.id,
    name: convenio.nome,
    benefitType: convenio.tipoBeneficio,
    benefitValue: convenio.valorBeneficio,
    active: convenio.ativo,
    attendanceCount: totalAtendimentos,
  }
}

function buscarConvenio(db: Banco, id: string | number, tenant: TenantId): LinhaConvenio | undefined {
  return db.prepare(`${SELECT_CONVENIO} WHERE c.id = ? AND c.tenant_id = ?`).get(id, tenant) as LinhaConvenio | undefined
}

/** Todo pedido precisa de um tenant válido E com a feature medicalAgreement ligada. */
function lerTenantComConvenio(req: Request, res: Response): TenantId | null {
  const tenant = req.query.tenant
  if (typeof tenant !== 'string' || !isTenantId(tenant)) {
    res.status(400).json({ erro: 'Informe um tenant válido em ?tenant=' })
    return null
  }
  if (!TENANTS[tenant].features.medicalAgreement) {
    res.status(403).json({ erro: `O módulo ${FEATURE_LABELS.medicalAgreement} não está disponível para ${TENANTS[tenant].name}.` })
    return null
  }
  return tenant
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

/** Valida o corpo do pedido e devolve um Convenio do domínio. */
function validar(corpo: Record<string, unknown>): { convenio?: Convenio; erro?: string } {
  const nome = texto(corpo.name)
  const tipo = texto(corpo.benefitType) as BenefitType
  if (!nome) return { erro: 'Informe o campo Nome.' }
  if (!BENEFIT_TYPES.includes(tipo)) {
    return { erro: `Tipo de benefício inválido. Use: ${BENEFIT_TYPES.map((item) => BENEFIT_TYPE_LABELS[item]).join(', ')}.` }
  }
  if (typeof corpo.active !== 'boolean') return { erro: 'Informe se o convênio está ativo.' }

  // valorBeneficio é o percentual ou a quantidade de horas; a isenção não usa valor
  const valor = typeof corpo.benefitValue === 'number' ? corpo.benefitValue : NaN
  if (tipo === 'percentual' && !(valor >= 1 && valor <= 100)) return { erro: 'O percentual de desconto deve estar entre 1 e 100.' }
  if (tipo === 'horasGratis' && !(Number.isInteger(valor) && valor >= 1)) return { erro: 'Informe a quantidade de horas grátis (número inteiro maior que zero).' }

  return { convenio: new Convenio('', nome, tipo, tipo === 'isencao' ? 0 : valor, corpo.active) }
}

function nomeRepetido(erro: unknown): boolean {
  return erro instanceof Error && 'code' in erro && erro.code === 'SQLITE_CONSTRAINT_UNIQUE'
}

export function criarRotasConvenios(db: Banco): Router {
  const rotas = Router()

  // READ — convênios do tenant, com a quantidade de atendimentos vinculados
  rotas.get('/', (req, res) => {
    const tenant = lerTenantComConvenio(req, res)
    if (!tenant) return
    const linhas = db.prepare(`${SELECT_CONVENIO} WHERE c.tenant_id = ? ORDER BY c.nome`).all(tenant) as LinhaConvenio[]
    res.json(linhas.map((linha) => paraJson(paraConvenio(linha), linha.total_atendimentos ?? 0)))
  })

  // CREATE
  rotas.post('/', (req, res) => {
    const tenant = lerTenantComConvenio(req, res)
    if (!tenant) return
    const { convenio, erro } = validar(req.body ?? {})
    if (!convenio) {
      res.status(400).json({ erro })
      return
    }

    try {
      const resultado = db.prepare(`
        INSERT INTO convenios (tenant_id, nome, tipo_beneficio, valor_beneficio, ativo)
        VALUES (?, ?, ?, ?, ?)
      `).run(tenant, convenio.nome, convenio.tipoBeneficio, convenio.valorBeneficio, convenio.ativo ? 1 : 0)
      const criado = buscarConvenio(db, Number(resultado.lastInsertRowid), tenant)!
      res.status(201).json(paraJson(paraConvenio(criado), 0))
    } catch (falha) {
      if (!nomeRepetido(falha)) throw falha
      res.status(409).json({ erro: `Já existe um convênio chamado ${convenio.nome} neste cliente.` })
    }
  })

  // UPDATE — inclusive desativar (convênio inativo deixa de tornar atendimentos elegíveis)
  rotas.put('/:id', (req, res) => {
    const tenant = lerTenantComConvenio(req, res)
    if (!tenant) return
    const { convenio, erro } = validar(req.body ?? {})
    if (!convenio) {
      res.status(400).json({ erro })
      return
    }

    try {
      const resultado = db.prepare(`
        UPDATE convenios SET nome = ?, tipo_beneficio = ?, valor_beneficio = ?, ativo = ?
        WHERE id = ? AND tenant_id = ?
      `).run(convenio.nome, convenio.tipoBeneficio, convenio.valorBeneficio, convenio.ativo ? 1 : 0, req.params.id, tenant)
      if (resultado.changes === 0) {
        res.status(404).json({ erro: 'Convênio não encontrado.' })
        return
      }
      const atualizado = buscarConvenio(db, req.params.id, tenant)!
      res.json(paraJson(paraConvenio(atualizado), atualizado.total_atendimentos ?? 0))
    } catch (falha) {
      if (!nomeRepetido(falha)) throw falha
      res.status(409).json({ erro: `Já existe um convênio chamado ${convenio.nome} neste cliente.` })
    }
  })

  // DELETE — só convênios sem atendimentos vinculados
  rotas.delete('/:id', (req, res) => {
    const tenant = lerTenantComConvenio(req, res)
    if (!tenant) return
    const linha = buscarConvenio(db, req.params.id, tenant)
    if (!linha) {
      res.status(404).json({ erro: 'Convênio não encontrado.' })
      return
    }
    if ((linha.total_atendimentos ?? 0) > 0) {
      res.status(409).json({ erro: `O convênio ${linha.nome} possui ${linha.total_atendimentos} atendimento(s) vinculado(s) e não pode ser excluído. Desative-o em vez de excluir.` })
      return
    }
    db.prepare('DELETE FROM convenios WHERE id = ? AND tenant_id = ?').run(linha.id, tenant)
    res.status(204).end()
  })

  // VALIDAÇÃO DE ATENDIMENTO — só verifica a elegibilidade; o benefício é consumido no pagamento
  rotas.post('/validate', (req, res) => {
    const tenant = lerTenantComConvenio(req, res)
    if (!tenant) return
    const numero = texto(req.body?.number).toUpperCase()
    if (!numero) {
      res.status(400).json({ erro: 'Informe o número do atendimento.' })
      return
    }

    const linhaAtendimento = db.prepare('SELECT * FROM atendimentos WHERE tenant_id = ? AND numero = ?').get(tenant, numero) as LinhaAtendimento | undefined
    if (!linhaAtendimento) {
      res.status(404).json({ erro: 'Atendimento não localizado.' })
      return
    }
    const linhaConvenio = buscarConvenio(db, linhaAtendimento.convenio_id, tenant)!

    // As regras (formato, convênio ativo, 24h, benefício já usado) estão na classe Atendimento
    const convenio = paraConvenio(linhaConvenio)
    const atendimento = paraAtendimento(linhaAtendimento, convenio)
    const elegivel = atendimento.validarElegibilidade()
    res.json({
      number: atendimento.numero,
      patient: atendimento.paciente,
      agreement: convenio.nome,
      benefit: convenio.descricaoBeneficio(),
      eligible: elegivel,
      reason: elegivel ? '' : atendimento.motivoInelegibilidade() ?? '',
    })
  })

  return rotas
}
