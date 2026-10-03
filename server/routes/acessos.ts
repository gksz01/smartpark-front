import { Router, type Request, type Response } from 'express'
import { ACCESS_DIRECTIONS, ACCESS_LABELS, ACCESS_STATUSES, isTenantId, TENANTS } from '../../src/core/config'
import type { AccessDirection, AccessMethod, AccessStatus, TenantId } from '../../src/core/types'
import { Acesso } from '../../src/domain/Acesso'
import type { Banco } from '../database/conexao'

/** Formato de uma linha da tabela acessos. */
interface LinhaAcesso {
  id: number
  tenant_id: string
  pessoa: string
  identificador: string
  metodo: AccessMethod
  direcao: AccessDirection
  status: AccessStatus
  manual: number // 0 ou 1
  motivo_negacao: string | null
  horario: string // ISO 8601
}

/** Linha do banco → objeto Acesso do domínio, com o status que já estava gravado. */
function paraAcesso(linha: LinhaAcesso): Acesso {
  const acesso = new Acesso(String(linha.id), linha.pessoa, linha.identificador, linha.metodo, linha.direcao, linha.manual === 1, new Date(linha.horario))
  acesso.status = linha.status
  acesso.motivoNegacao = linha.motivo_negacao ?? undefined
  return acesso
}

/** Objeto Acesso → formato AccessRecord do frontend (core/types.ts). */
function paraJson(acesso: Acesso) {
  return {
    id: acesso.id,
    person: acesso.pessoa,
    identifier: acesso.identificador,
    method: acesso.metodo,
    direction: acesso.direcao,
    status: acesso.status,
    manual: acesso.ehManual(),
    denialReason: acesso.motivoNegacao ?? '',
    time: acesso.horarioFormatado(),
  }
}

/** Todo pedido precisa informar o cliente: /api/access?tenant=company */
function lerTenant(req: Request, res: Response): TenantId | null {
  const tenant = req.query.tenant
  if (typeof tenant !== 'string' || !isTenantId(tenant)) {
    res.status(400).json({ erro: 'Informe um tenant válido em ?tenant=' })
    return null
  }
  return tenant
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

interface DadosAcesso {
  pessoa: string
  identificador: string
  direcao: AccessDirection
  status: AccessStatus
  motivo: string
}

/** Valida o corpo do pedido. O método precisa ser o accessMethod configurado para o tenant. */
function validar(corpo: Record<string, unknown>, tenant: TenantId): { dados?: DadosAcesso; erro?: string } {
  const metodoDoTenant = TENANTS[tenant].accessMethod
  const pessoa = texto(corpo.person)
  const identificador = texto(corpo.identifier).toUpperCase()
  const direcao = texto(corpo.direction) as AccessDirection
  const status = texto(corpo.status) as AccessStatus

  if (!pessoa) return { erro: 'Informe o campo Pessoa.' }
  if (!identificador) return { erro: 'Informe o identificador do acesso.' }
  if (corpo.method !== metodoDoTenant) {
    return { erro: `Método de acesso incompatível com ${TENANTS[tenant].name}. Use: ${ACCESS_LABELS[metodoDoTenant]}.` }
  }
  if (!ACCESS_DIRECTIONS.includes(direcao)) return { erro: `Direção inválida. Use: ${ACCESS_DIRECTIONS.join(', ')}.` }
  if (!ACCESS_STATUSES.includes(status)) return { erro: `Status inválido. Use: ${ACCESS_STATUSES.join(', ')}.` }

  return { dados: { pessoa, identificador, direcao, status, motivo: texto(corpo.denialReason) } }
}

/**
 * Leva o acesso ao status pedido usando as regras da classe Acesso:
 * Pendente → Liberado com liberar(); Pendente → Negado com negar(motivo).
 * Um acesso já decidido não muda mais de status (regra do domínio).
 */
function decidirStatus(acesso: Acesso, status: AccessStatus, motivo: string): string | null {
  if (status === acesso.status) {
    // Mesmo status: no Negado é permitido corrigir o motivo
    if (status === 'Negado') {
      if (!motivo) return 'Informe o motivo da negação.'
      acesso.motivoNegacao = motivo
    }
    return null
  }
  if (status === 'Pendente') return `Este acesso já foi ${acesso.status.toLowerCase()} e não pode voltar para Pendente.`
  try {
    if (status === 'Liberado') acesso.liberar()
    if (status === 'Negado') acesso.negar(motivo)
    return null
  } catch (falha) {
    return (falha as Error).message
  }
}

export function criarRotasAcessos(db: Banco): Router {
  const rotas = Router()

  // READ — lista os acessos do tenant, mais recentes primeiro
  rotas.get('/', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const linhas = db.prepare('SELECT * FROM acessos WHERE tenant_id = ? ORDER BY horario DESC, id DESC').all(tenant) as LinhaAcesso[]
    res.json(linhas.map((linha) => paraJson(paraAcesso(linha))))
  })

  // CREATE — liberação manual: o registro nasce com manual = 1 e horário atual
  rotas.post('/', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const { dados, erro } = validar(req.body ?? {}, tenant)
    if (!dados) {
      res.status(400).json({ erro })
      return
    }

    const acesso = new Acesso('', dados.pessoa, dados.identificador, TENANTS[tenant].accessMethod, dados.direcao, true, new Date())
    const erroStatus = decidirStatus(acesso, dados.status, dados.motivo)
    if (erroStatus) {
      res.status(400).json({ erro: erroStatus })
      return
    }

    const resultado = db.prepare(`
      INSERT INTO acessos (tenant_id, pessoa, identificador, metodo, direcao, status, manual, motivo_negacao, horario)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(tenant, acesso.pessoa, acesso.identificador, acesso.metodo, acesso.direcao, acesso.status, acesso.motivoNegacao ?? null, acesso.horario.toISOString())
    const criado = db.prepare('SELECT * FROM acessos WHERE id = ?').get(resultado.lastInsertRowid) as LinhaAcesso
    res.status(201).json(paraJson(paraAcesso(criado)))
  })

  // UPDATE — edita dados e decide o status pelas regras da classe Acesso
  rotas.put('/:id', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const { dados, erro } = validar(req.body ?? {}, tenant)
    if (!dados) {
      res.status(400).json({ erro })
      return
    }

    const linha = db.prepare('SELECT * FROM acessos WHERE id = ? AND tenant_id = ?').get(req.params.id, tenant) as LinhaAcesso | undefined
    if (!linha) {
      res.status(404).json({ erro: 'Acesso não encontrado.' })
      return
    }

    const acesso = paraAcesso(linha)
    acesso.pessoa = dados.pessoa
    acesso.identificador = dados.identificador
    acesso.direcao = dados.direcao
    const erroStatus = decidirStatus(acesso, dados.status, dados.motivo)
    if (erroStatus) {
      res.status(400).json({ erro: erroStatus })
      return
    }

    db.prepare(`
      UPDATE acessos SET pessoa = ?, identificador = ?, direcao = ?, status = ?, motivo_negacao = ?
      WHERE id = ? AND tenant_id = ?
    `).run(acesso.pessoa, acesso.identificador, acesso.direcao, acesso.status, acesso.motivoNegacao ?? null, req.params.id, tenant)
    const atualizado = db.prepare('SELECT * FROM acessos WHERE id = ?').get(req.params.id) as LinhaAcesso
    res.json(paraJson(paraAcesso(atualizado)))
  })

  // DELETE — também filtrado por tenant_id
  rotas.delete('/:id', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const resultado = db.prepare('DELETE FROM acessos WHERE id = ? AND tenant_id = ?').run(req.params.id, tenant)
    if (resultado.changes === 0) {
      res.status(404).json({ erro: 'Acesso não encontrado.' })
      return
    }
    res.status(204).end()
  })

  return rotas
}
