import { Router, type Request, type Response } from 'express'
import { isTenantId, SPACE_STATUSES, TENANTS } from '../../src/core/config'
import type { SpaceStatus, SpaceType, TenantId } from '../../src/core/types'
import { CRIADOR_POR_TIPO } from '../../src/domain/factories/vaga/criadorPorTipo'
import { VARIANTE_POR_TENANT } from '../../src/domain/factories/variante/variantePorTenant'
import type { Notificacao } from '../../src/domain/Notificacao'
import { registrarObservadoresSensor } from '../../src/domain/observer/registrarObservadores'
import { Sensor } from '../../src/domain/Sensor'
import type { Vaga } from '../../src/domain/Vaga'
import type { Banco } from '../database/conexao'

/** Formato de uma linha da tabela vagas. */
export interface LinhaVaga {
  id: number
  tenant_id: string
  codigo: string
  setor: string
  tipo: SpaceType
  status: SpaceStatus
}

/**
 * FACTORY METHOD em uso: o tipo da vaga escolhe o Creator, e o Creator
 * cria a subclasse concreta (VagaPCD, VagaPrioritaria, VagaNominal...).
 */
function criarVaga(id: string, codigo: string, setor: string, tipo: SpaceType, status: SpaceStatus): Vaga {
  const criador = CRIADOR_POR_TIPO[tipo]
  const vaga = criador.criarVaga(id, codigo, setor)
  vaga.status = status
  return vaga
}

/** Linha do banco → objeto do domínio (também passa pelo Factory Method). */
function paraVaga(linha: LinhaVaga): Vaga {
  return criarVaga(String(linha.id), linha.codigo, linha.setor, linha.tipo, linha.status)
}

/** Objeto do domínio → formato ParkingSpace do frontend (core/types.ts). */
function paraJson(vaga: Vaga) {
  return {
    id: vaga.id,
    code: vaga.codigo,
    sector: vaga.setor,
    type: vaga.tipo,
    status: vaga.status,
    requirement: vaga.requisitoDeUso(), // comportamento próprio de cada subclasse
  }
}

/** Todo pedido precisa informar o cliente: /api/spaces?tenant=hospital */
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

/**
 * Valida o corpo do pedido e devolve a Vaga concreta criada pelo Factory Method.
 * O tipo permitido depende do tenant (spaceTypes em TENANTS).
 */
function validar(corpo: Record<string, unknown>, tenant: TenantId): { vaga?: Vaga; erro?: string } {
  const configuracao = TENANTS[tenant]
  const codigo = texto(corpo.code).toUpperCase()
  const setor = texto(corpo.sector)
  const tipo = texto(corpo.type) as SpaceType
  const status = texto(corpo.status) as SpaceStatus

  if (!codigo) return { erro: 'Informe o campo Código.' }
  if (!setor) return { erro: 'Informe o campo Setor.' }
  if (!configuracao.spaceTypes.includes(tipo)) {
    return { erro: `Tipo de vaga não permitido em ${configuracao.name}. Use: ${configuracao.spaceTypes.join(', ')}.` }
  }
  if (!SPACE_STATUSES.includes(status)) return { erro: `Status inválido. Use: ${SPACE_STATUSES.join(', ')}.` }

  return { vaga: criarVaga('', codigo, setor, tipo, status) }
}

function codigoRepetido(erro: unknown): boolean {
  return erro instanceof Error && 'code' in erro && erro.code === 'SQLITE_CONSTRAINT_UNIQUE'
}

export function criarRotasVagas(db: Banco): Router {
  const rotas = Router()

  // READ — lista apenas as vagas do tenant informado
  rotas.get('/', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const linhas = db.prepare('SELECT * FROM vagas WHERE tenant_id = ? ORDER BY codigo').all(tenant) as LinhaVaga[]
    res.json(linhas.map((linha) => paraJson(paraVaga(linha))))
  })

  // CREATE — tela → API → Creator do tipo → Vaga concreta → SQLite
  rotas.post('/', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const { vaga, erro } = validar(req.body ?? {}, tenant)
    if (!vaga) {
      res.status(400).json({ erro })
      return
    }

    try {
      const resultado = db.prepare(`
        INSERT INTO vagas (tenant_id, codigo, setor, tipo, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(tenant, vaga.codigo, vaga.setor, vaga.tipo, vaga.status)
      const criada = db.prepare('SELECT * FROM vagas WHERE id = ?').get(resultado.lastInsertRowid) as LinhaVaga
      res.status(201).json(paraJson(paraVaga(criada)))
    } catch (falha) {
      if (!codigoRepetido(falha)) throw falha
      res.status(409).json({ erro: `Já existe uma vaga com o código ${vaga.codigo} neste cliente.` })
    }
  })

  // UPDATE — o WHERE com tenant_id impede alterar vaga de outro cliente
  rotas.put('/:id', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const { vaga, erro } = validar(req.body ?? {}, tenant)
    if (!vaga) {
      res.status(400).json({ erro })
      return
    }

    try {
      const resultado = db.prepare(`
        UPDATE vagas SET codigo = ?, setor = ?, tipo = ?, status = ?
        WHERE id = ? AND tenant_id = ?
      `).run(vaga.codigo, vaga.setor, vaga.tipo, vaga.status, req.params.id, tenant)
      if (resultado.changes === 0) {
        res.status(404).json({ erro: 'Vaga não encontrada.' })
        return
      }
      const atualizada = db.prepare('SELECT * FROM vagas WHERE id = ?').get(req.params.id) as LinhaVaga
      res.json(paraJson(paraVaga(atualizada)))
    } catch (falha) {
      if (!codigoRepetido(falha)) throw falha
      res.status(409).json({ erro: `Já existe uma vaga com o código ${vaga.codigo} neste cliente.` })
    }
  })

  // DELETE — só vagas Livres ou Bloqueadas (regra da classe Vaga)
  rotas.delete('/:id', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const linha = db.prepare('SELECT * FROM vagas WHERE id = ? AND tenant_id = ?').get(req.params.id, tenant) as LinhaVaga | undefined
    if (!linha) {
      res.status(404).json({ erro: 'Vaga não encontrada.' })
      return
    }
    const vaga = paraVaga(linha)
    if (!vaga.podeSerExcluida()) {
      res.status(409).json({ erro: `A vaga ${vaga.codigo} está ${vaga.status} e não pode ser excluída. Libere ou bloqueie a vaga antes.` })
      return
    }
    try {
      db.prepare('DELETE FROM vagas WHERE id = ? AND tenant_id = ?').run(req.params.id, tenant)
    } catch (falha) {
      // Foreign key: a vaga ainda aparece em reservas (canceladas ou concluídas)
      if (!(falha instanceof Error && 'code' in falha && falha.code === 'SQLITE_CONSTRAINT_FOREIGNKEY')) throw falha
      res.status(409).json({ erro: `A vaga ${vaga.codigo} possui reservas registradas. Exclua as reservas dela antes.` })
      return
    }
    res.status(204).end()
  })

  /*
   * OBSERVER — Exemplo 1 no sistema real: simulação de leitura do sensor da vaga.
   * Sensor (Subject) → ObservadorVagaSensor muda a Vaga → ObservadorNotificacaoSensor cria a
   * Notificacao → a API grava o novo status no SQLite (o Observer só trabalha em memória).
   */
  rotas.post('/:id/sensor', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const leitura = req.body?.reading
    if (leitura !== 'ocupada' && leitura !== 'liberada') {
      res.status(400).json({ erro: 'Informe a leitura do sensor: ocupada ou liberada.' })
      return
    }
    const linha = db.prepare('SELECT * FROM vagas WHERE id = ? AND tenant_id = ?').get(req.params.id, tenant) as LinhaVaga | undefined
    if (!linha) {
      res.status(404).json({ erro: 'Vaga não encontrada.' })
      return
    }

    const vaga = paraVaga(linha)
    // Não há tabela de sensores: o sensor da vaga começa com o estado que está gravado no banco
    const sensor = new Sensor(`sensor-${vaga.id}`, `SN-${vaga.codigo}`, vaga.codigo)
    sensor.ocupado = vaga.status === 'Ocupada'
    const notificacoes: Notificacao[] = []
    registrarObservadoresSensor(sensor, vaga, VARIANTE_POR_TENANT[tenant], notificacoes)

    try {
      const mudou = leitura === 'ocupada' ? sensor.detectarOcupacao() : sensor.detectarLiberacao()
      if (!mudou) {
        res.status(409).json({ erro: `O sensor já indica a vaga ${vaga.codigo} como ${leitura === 'ocupada' ? 'ocupada' : 'livre'}.` })
        return
      }
    } catch (falha) {
      // Regra da Vaga recusada pelo observador (ex.: vaga Bloqueada não pode ser ocupada)
      res.status(409).json({ erro: (falha as Error).message })
      return
    }

    const resultado = db.prepare('UPDATE vagas SET status = ? WHERE id = ? AND tenant_id = ? AND status = ?').run(vaga.status, linha.id, tenant, linha.status)
    if (resultado.changes !== 1) {
      res.status(409).json({ erro: `A vaga ${vaga.codigo} foi alterada por outra operação. Tente novamente.` })
      return
    }
    const atualizada = db.prepare('SELECT * FROM vagas WHERE id = ?').get(linha.id) as LinhaVaga
    res.json({ space: paraJson(paraVaga(atualizada)), notifications: notificacoes.map((item) => item.formatar()) })
  })

  return rotas
}
