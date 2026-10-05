import { Router, type Request, type Response } from 'express'
import { FEATURE_LABELS, isTenantId, TENANTS } from '../../src/core/config'
import type { ReservationStatus, TenantId } from '../../src/core/types'
import { Estacionamento } from '../../src/domain/Estacionamento'
import { CRIADOR_POR_TIPO } from '../../src/domain/factories/vaga/criadorPorTipo'
import { VARIANTE_POR_TENANT } from '../../src/domain/factories/variante/variantePorTenant'
import type { Notificacao } from '../../src/domain/Notificacao'
import { criarEventosReserva } from '../../src/domain/observer/registrarObservadores'
import type { EventosReserva } from '../../src/domain/observer/reserva/EventosReserva'
import { Reserva } from '../../src/domain/Reserva'
import type { Tarifa } from '../../src/domain/Tarifa'
import type { Vaga } from '../../src/domain/Vaga'
import type { Banco } from '../database/conexao'
import { paraTarifa, type LinhaTarifa } from './tarifas'
import type { LinhaVaga } from './vagas'

/** Linha da tabela reservas já com dados do veículo e da vaga (JOIN). */
interface LinhaReserva {
  id: number
  tenant_id: string
  veiculo_id: number
  vaga_id: number
  data: string
  hora: string
  duracao_horas: number
  valor_estimado: number
  status: ReservationStatus
  placa: string
  apelido: string
  codigo_vaga: string
}

const SELECT_RESERVA = `
  SELECT r.*, v.placa, v.apelido, g.codigo AS codigo_vaga
  FROM reservas r
  JOIN veiculos v ON v.id = r.veiculo_id
  JOIN vagas g ON g.id = r.vaga_id
`

/**
 * Linha do banco → Reserva do domínio.
 * No domínio a reserva aponta para a vaga pelo código (único no tenant);
 * no banco, pela foreign key numérica vaga_id.
 */
function paraReserva(linha: LinhaReserva): Reserva {
  return new Reserva(String(linha.id), String(linha.veiculo_id), linha.codigo_vaga, linha.data, linha.hora, linha.duracao_horas, linha.status, linha.valor_estimado)
}

/** Reserva → formato Reservation do frontend (core/types.ts). */
function paraJson(reserva: Reserva, linha: LinhaReserva) {
  return {
    id: reserva.id,
    vehicleId: reserva.veiculoId,
    vehicleLabel: `${linha.apelido} · ${linha.placa}`,
    spaceId: String(linha.vaga_id),
    spaceCode: reserva.vagaId,
    date: reserva.data,
    time: reserva.hora,
    duration: reserva.duracaoHoras,
    estimate: reserva.valorEstimado,
    status: reserva.status,
  }
}

function buscarReserva(db: Banco, id: string | number, tenant: TenantId): LinhaReserva | undefined {
  return db.prepare(`${SELECT_RESERVA} WHERE r.id = ? AND r.tenant_id = ?`).get(id, tenant) as LinhaReserva | undefined
}

/** Linha da vaga → objeto Vaga (Factory Method), identificado pelo código. */
function vagaDoDominio(linha: LinhaVaga): Vaga {
  const vaga = CRIADOR_POR_TIPO[linha.tipo].criarVaga(linha.codigo, linha.codigo, linha.setor)
  vaga.status = linha.status
  return vaga
}

/** Tarifa ativa do tenant, com a Strategy reconstruída (infraestrutura da etapa de Tarifas). */
function carregarTarifaAtiva(db: Banco, tenant: TenantId): Tarifa | null {
  const linha = db.prepare('SELECT * FROM tarifas WHERE tenant_id = ? AND ativa = 1').get(tenant) as LinhaTarifa | undefined
  return linha ? paraTarifa(linha) : null
}

/**
 * OBSERVER: monta o Subject EventosReserva com os observadores da Parte 01.
 * criarEventosReserva() inscreve o observador da vaga e, se a feature
 * notifications estiver ligada na variante, o de notificação.
 */
function montarEventos(tenant: TenantId, vaga: Vaga, notificacoes: Notificacao[]): EventosReserva {
  const estacionamento = new Estacionamento(tenant, TENANTS[tenant].name, '', true, false, [vaga])
  return criarEventosReserva(estacionamento, VARIANTE_POR_TENANT[tenant], notificacoes)
}

/**
 * O Observer altera o objeto Vaga em memória; aqui o novo status vai para o SQLite.
 * O "AND status = ?" garante que ninguém mudou a vaga no meio da operação.
 */
function persistirVaga(db: Banco, linha: LinhaVaga, vaga: Vaga): void {
  if (vaga.status === linha.status) return
  const resultado = db.prepare('UPDATE vagas SET status = ? WHERE id = ? AND status = ?').run(vaga.status, linha.id, linha.status)
  if (resultado.changes !== 1) throw new Error(`A vaga ${vaga.codigo} foi alterada por outra operação. Tente novamente.`)
}

/** Regras do domínio (Reserva, Vaga) viram 409; o índice único do banco também. */
function responderConflito(res: Response, falha: unknown): void {
  if (falha instanceof Error && 'code' in falha) {
    if (falha.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw falha
    res.status(409).json({ erro: 'Esta vaga já possui uma reserva confirmada.' })
    return
  }
  res.status(409).json({ erro: (falha as Error).message })
}

/** Todo pedido precisa de um tenant válido E com a feature reservation ligada. */
function lerTenantComReserva(req: Request, res: Response): TenantId | null {
  const tenant = req.query.tenant
  if (typeof tenant !== 'string' || !isTenantId(tenant)) {
    res.status(400).json({ erro: 'Informe um tenant válido em ?tenant=' })
    return null
  }
  if (!TENANTS[tenant].features.reservation) {
    res.status(403).json({ erro: `O módulo ${FEATURE_LABELS.reservation} não está disponível para ${TENANTS[tenant].name}.` })
    return null
  }
  return tenant
}

/** Valida data, horário e duração (usados na criação e na alteração). */
function validarPeriodo(corpo: Record<string, unknown>): { data?: string; hora?: string; duracao?: number; erro?: string } {
  const data = typeof corpo.date === 'string' ? corpo.date : ''
  const hora = typeof corpo.time === 'string' ? corpo.time : ''
  const duracao = corpo.duration
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { erro: 'Informe a data no formato AAAA-MM-DD.' }
  if (!/^\d{2}:\d{2}$/.test(hora)) return { erro: 'Informe o horário no formato HH:MM.' }
  if (typeof duracao !== 'number' || !Number.isInteger(duracao) || duracao < 1 || duracao > 24) {
    return { erro: 'A duração deve ser um número inteiro de 1 a 24 horas.' }
  }
  return { data, hora, duracao }
}

export function criarRotasReservas(db: Banco): Router {
  const rotas = Router()

  // READ — reservas do tenant, com veículo e vaga
  rotas.get('/', (req, res) => {
    const tenant = lerTenantComReserva(req, res)
    if (!tenant) return
    const linhas = db.prepare(`${SELECT_RESERVA} WHERE r.tenant_id = ? ORDER BY r.data DESC, r.hora DESC`).all(tenant) as LinhaReserva[]
    res.json(linhas.map((linha) => paraJson(paraReserva(linha), linha)))
  })

  // CREATE — cria, calcula com a Strategy, confirma pelo Observer e grava tudo numa transação
  rotas.post('/', (req, res) => {
    const tenant = lerTenantComReserva(req, res)
    if (!tenant) return
    const corpo = req.body ?? {}
    const { data, hora, duracao, erro } = validarPeriodo(corpo)
    if (erro) {
      res.status(400).json({ erro })
      return
    }

    // Veículo e vaga precisam ser DESTE tenant (não confiamos só no id enviado)
    const veiculo = db.prepare('SELECT id FROM veiculos WHERE id = ? AND tenant_id = ?').get(corpo.vehicleId, tenant) as { id: number } | undefined
    if (!veiculo) {
      res.status(400).json({ erro: 'Veículo não encontrado neste cliente.' })
      return
    }
    const linhaVaga = db.prepare('SELECT * FROM vagas WHERE id = ? AND tenant_id = ?').get(corpo.spaceId, tenant) as LinhaVaga | undefined
    if (!linhaVaga) {
      res.status(400).json({ erro: 'Vaga não encontrada neste cliente.' })
      return
    }
    const tarifa = carregarTarifaAtiva(db, tenant)
    if (!tarifa) {
      res.status(409).json({ erro: 'Não há tarifa ativa neste cliente. Ative uma tarifa antes de reservar.' })
      return
    }

    const notificacoes: Notificacao[] = []
    const criar = db.transaction(() => {
      const vaga = vagaDoDominio(linhaVaga)
      if (!vaga.estaDisponivel()) throw new Error(`A vaga ${vaga.codigo} não está livre para reserva (status: ${vaga.status}).`)

      const reserva = new Reserva('', String(veiculo.id), vaga.id, data!, hora!, duracao!)
      reserva.calcularEstimativa(tarifa) // Reserva → Tarifa → Strategy concreta

      const eventos = montarEventos(tenant, vaga, notificacoes)
      eventos.confirmar(reserva) // Observer: vaga.reservar() + notificação

      const resultado = db.prepare(`
        INSERT INTO reservas (tenant_id, veiculo_id, vaga_id, data, hora, duracao_horas, valor_estimado, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(tenant, veiculo.id, linhaVaga.id, reserva.data, reserva.hora, reserva.duracaoHoras, reserva.valorEstimado, reserva.status)
      persistirVaga(db, linhaVaga, vaga) // grava o status que o Observer deixou na vaga
      return resultado.lastInsertRowid
    })

    try {
      const id = criar()
      const linha = buscarReserva(db, Number(id), tenant)!
      res.status(201).json({ reservation: paraJson(paraReserva(linha), linha), notifications: notificacoes.map((item) => item.mensagem) })
    } catch (falha) {
      responderConflito(res, falha)
    }
  })

  // UPDATE — altera data, horário e duração e recalcula a estimativa com a Strategy
  rotas.put('/:id', (req, res) => {
    const tenant = lerTenantComReserva(req, res)
    if (!tenant) return
    const { data, hora, duracao, erro } = validarPeriodo(req.body ?? {})
    if (erro) {
      res.status(400).json({ erro })
      return
    }
    const linha = buscarReserva(db, req.params.id, tenant)
    if (!linha) {
      res.status(404).json({ erro: 'Reserva não encontrada.' })
      return
    }
    const tarifa = carregarTarifaAtiva(db, tenant)
    if (!tarifa) {
      res.status(409).json({ erro: 'Não há tarifa ativa neste cliente. Ative uma tarifa antes de alterar a reserva.' })
      return
    }

    const notificacoes: Notificacao[] = []
    const alterar = db.transaction(() => {
      const linhaVaga = db.prepare('SELECT * FROM vagas WHERE id = ?').get(linha.vaga_id) as LinhaVaga
      const reserva = paraReserva(linha)
      const eventos = montarEventos(tenant, vagaDoDominio(linhaVaga), notificacoes)
      eventos.alterar(reserva, data!, hora!, duracao!) // a classe Reserva recusa reservas canceladas/concluídas
      reserva.calcularEstimativa(tarifa)
      db.prepare('UPDATE reservas SET data = ?, hora = ?, duracao_horas = ?, valor_estimado = ? WHERE id = ? AND tenant_id = ?')
        .run(reserva.data, reserva.hora, reserva.duracaoHoras, reserva.valorEstimado, linha.id, tenant)
    })

    try {
      alterar()
      const atualizada = buscarReserva(db, linha.id, tenant)!
      res.json({ reservation: paraJson(paraReserva(atualizada), atualizada), notifications: notificacoes.map((item) => item.mensagem) })
    } catch (falha) {
      responderConflito(res, falha)
    }
  })

  // UPDATE (status) — cancelar: o Observer libera a vaga e a API grava os dois registros
  rotas.put('/:id/cancel', (req, res) => {
    const tenant = lerTenantComReserva(req, res)
    if (!tenant) return
    const linha = buscarReserva(db, req.params.id, tenant)
    if (!linha) {
      res.status(404).json({ erro: 'Reserva não encontrada.' })
      return
    }

    const notificacoes: Notificacao[] = []
    const cancelar = db.transaction(() => {
      const linhaVaga = db.prepare('SELECT * FROM vagas WHERE id = ?').get(linha.vaga_id) as LinhaVaga
      const reserva = paraReserva(linha)
      const vaga = vagaDoDominio(linhaVaga)
      const eventos = montarEventos(tenant, vaga, notificacoes)
      eventos.cancelar(reserva) // Observer: libera a vaga se ela ainda estiver Reservada
      db.prepare('UPDATE reservas SET status = ? WHERE id = ? AND tenant_id = ?').run(reserva.status, linha.id, tenant)
      persistirVaga(db, linhaVaga, vaga)
    })

    try {
      cancelar()
      const atualizada = buscarReserva(db, linha.id, tenant)!
      res.json({ reservation: paraJson(paraReserva(atualizada), atualizada), notifications: notificacoes.map((item) => item.mensagem) })
    } catch (falha) {
      responderConflito(res, falha)
    }
  })

  // DELETE — só reservas canceladas ou concluídas
  rotas.delete('/:id', (req, res) => {
    const tenant = lerTenantComReserva(req, res)
    if (!tenant) return
    const linha = buscarReserva(db, req.params.id, tenant)
    if (!linha) {
      res.status(404).json({ erro: 'Reserva não encontrada.' })
      return
    }
    if (paraReserva(linha).estaAtiva()) {
      res.status(409).json({ erro: 'Cancele a reserva antes de excluir.' })
      return
    }
    try {
      db.prepare('DELETE FROM reservas WHERE id = ? AND tenant_id = ?').run(linha.id, tenant)
    } catch (falha) {
      // Foreign key: a reserva aparece em um pagamento
      if (!(falha instanceof Error && 'code' in falha && falha.code === 'SQLITE_CONSTRAINT_FOREIGNKEY')) throw falha
      res.status(409).json({ erro: 'Esta reserva possui pagamento registrado. Exclua o pagamento antes.' })
      return
    }
    res.status(204).end()
  })

  return rotas
}
