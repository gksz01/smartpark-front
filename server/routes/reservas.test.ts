// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TENANTS } from '../../src/core/config'
import { VARIANTE_POR_TENANT } from '../../src/domain/factories/variante/variantePorTenant'
import { EventosReserva } from '../../src/domain/observer/reserva/EventosReserva'
import { ObservadorNotificacaoReserva } from '../../src/domain/observer/reserva/ObservadorNotificacaoReserva'
import { ObservadorVagaReserva } from '../../src/domain/observer/reserva/ObservadorVagaReserva'
import { criarApp } from '../app'
import { abrirBanco, type Banco } from '../database/conexao'
import { popularBanco } from '../seed/seed'

let db: Banco
let app: ReturnType<typeof criarApp>

beforeEach(() => {
  db = abrirBanco(':memory:') // SQLite real, mas temporário
  popularBanco(db)
  app = criarApp(db)
})

afterEach(() => {
  db.close()
  vi.restoreAllMocks()
})

function idDaVaga(codigo: string, tenant = 'shopping'): number {
  return (db.prepare('SELECT id FROM vagas WHERE codigo = ? AND tenant_id = ?').get(codigo, tenant) as { id: number }).id
}
function statusDaVaga(codigo: string, tenant = 'shopping'): string {
  return (db.prepare('SELECT status FROM vagas WHERE codigo = ? AND tenant_id = ?').get(codigo, tenant) as { status: string }).status
}
function idDoVeiculo(placa: string, tenant = 'shopping'): number {
  return (db.prepare('SELECT id FROM veiculos WHERE placa = ? AND tenant_id = ?').get(placa, tenant) as { id: number }).id
}
function reservaPorId(id: number | string) {
  return db.prepare('SELECT * FROM reservas WHERE id = ?').get(id) as Record<string, unknown> | undefined
}
function idDaReserva(status: string): number {
  return (db.prepare("SELECT id FROM reservas WHERE tenant_id = 'shopping' AND status = ?").get(status) as { id: number }).id
}
function novaReserva(codigoVaga = 'A-01', extra: Record<string, unknown> = {}) {
  return { vehicleId: String(idDoVeiculo('SPK1A23')), spaceId: String(idDaVaga(codigoVaga)), date: '2026-12-20', time: '09:00', duration: 3, ...extra }
}

describe('API de reservas — CRUD no SQLite', () => {
  it('READ: lista as reservas do tenant com veículo e vaga', async () => {
    const resposta = await request(app).get('/api/reservations?tenant=shopping')
    expect(resposta.status).toBe(200)
    expect(resposta.body.map((reserva: { status: string }) => reserva.status)).toEqual(['confirmada', 'cancelada', 'concluida'])
    expect(resposta.body[0]).toMatchObject({ vehicleLabel: 'Família · BRA2E19', spaceCode: 'A-03', time: '18:30', duration: 2, estimate: 24 })
  })

  it('CREATE: grava a reserva confirmada e a vaga passa para Reservada no banco', async () => {
    expect(statusDaVaga('A-01')).toBe('Livre')
    const resposta = await request(app).post('/api/reservations?tenant=shopping').send(novaReserva())
    expect(resposta.status).toBe(201)
    expect(resposta.body.reservation).toMatchObject({ spaceCode: 'A-01', duration: 3, estimate: 36, status: 'confirmada' })
    expect(resposta.body.notifications).toEqual(['Reserva confirmada para a vaga A-01.'])
    expect(reservaPorId(resposta.body.reservation.id)).toMatchObject({ tenant_id: 'shopping', vaga_id: idDaVaga('A-01'), duracao_horas: 3, valor_estimado: 36, status: 'confirmada' })
    expect(statusDaVaga('A-01')).toBe('Reservada')
  })

  it('UPDATE: alterar a duração recalcula o valor com a Strategy', async () => {
    const id = idDaReserva('confirmada')
    const resposta = await request(app).put(`/api/reservations/${id}?tenant=shopping`).send({ date: '2026-12-21', time: '20:00', duration: 4 })
    expect(resposta.status).toBe(200)
    expect(resposta.body.notifications).toEqual(['Nova data: 2026-12-21 às 20:00, por 4h.'])
    expect(reservaPorId(id)).toMatchObject({ data: '2026-12-21', hora: '20:00', duracao_horas: 4, valor_estimado: 48, status: 'confirmada' })
    expect(statusDaVaga('A-03')).toBe('Reservada') // alterar não mexe na vaga
  })

  it('CANCEL: a reserva fica cancelada e a vaga volta para Livre no banco', async () => {
    const id = idDaReserva('confirmada')
    const resposta = await request(app).put(`/api/reservations/${id}/cancel?tenant=shopping`)
    expect(resposta.status).toBe(200)
    expect(resposta.body.notifications).toEqual(['Reserva cancelada. A vaga A-03 foi liberada.'])
    expect(reservaPorId(id)).toMatchObject({ status: 'cancelada' })
    expect(statusDaVaga('A-03')).toBe('Livre')
  })

  it('DELETE: recusa reserva ativa; depois de cancelada, exclui', async () => {
    const id = idDaReserva('confirmada')
    const antes = await request(app).delete(`/api/reservations/${id}?tenant=shopping`)
    expect(antes.status).toBe(409)
    expect(antes.body.erro).toBe('Cancele a reserva antes de excluir.')

    await request(app).put(`/api/reservations/${id}/cancel?tenant=shopping`)
    const depois = await request(app).delete(`/api/reservations/${id}?tenant=shopping`)
    expect(depois.status).toBe(204)
    expect(reservaPorId(id)).toBeUndefined()
  })

  it('DELETE: exclui reserva concluída', async () => {
    const id = idDaReserva('concluida')
    expect((await request(app).delete(`/api/reservations/${id}?tenant=shopping`)).status).toBe(204)
  })

  it('os dados continuam no arquivo SQLite depois de fechar e reabrir o banco', async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'smartpark-'))
    const arquivo = join(pasta, 'teste.db')
    try {
      const bancoArquivo = abrirBanco(arquivo)
      popularBanco(bancoArquivo)
      const corpo = { vehicleId: '1', spaceId: '1', date: '2026-12-20', time: '09:00', duration: 1 } // SPK1A23 e A-01 do seed
      await request(criarApp(bancoArquivo)).post('/api/reservations?tenant=shopping').send(corpo)
      bancoArquivo.close()

      const reaberto = abrirBanco(arquivo)
      const resposta = await request(criarApp(reaberto)).get('/api/reservations?tenant=shopping')
      const vaga = reaberto.prepare("SELECT status FROM vagas WHERE codigo = 'A-01' AND tenant_id = 'shopping'").get()
      reaberto.close()
      expect(resposta.body.some((reserva: { spaceCode: string; status: string }) => reserva.spaceCode === 'A-01' && reserva.status === 'confirmada')).toBe(true)
      expect(vaga).toEqual({ status: 'Reservada' })
    } finally {
      rmSync(pasta, { recursive: true, force: true })
    }
  })
})

describe('API de reservas — Strategy da tarifa ativa', () => {
  it('a estimativa respeita o teto diário da TarifaPorHora', async () => {
    const resposta = await request(app).post('/api/reservations?tenant=shopping').send(novaReserva('A-01', { duration: 8 }))
    expect(resposta.body.reservation.estimate).toBe(60) // 8 × 12 = 96, limitado a 60
  })

  it('trocar a tarifa ativa troca a Strategy usada na estimativa', async () => {
    db.prepare("UPDATE tarifas SET ativa = 0 WHERE tenant_id = 'shopping'").run()
    db.prepare("UPDATE tarifas SET ativa = 1 WHERE nome = 'Diária promocional'").run()
    const resposta = await request(app).post('/api/reservations?tenant=shopping').send(novaReserva('A-01', { duration: 3 }))
    expect(resposta.body.reservation.estimate).toBe(40) // TarifaFixaDiaria: 1 diária
  })

  it('sem tarifa ativa, a reserva é recusada', async () => {
    db.prepare("UPDATE tarifas SET ativa = 0 WHERE tenant_id = 'shopping'").run()
    const resposta = await request(app).post('/api/reservations?tenant=shopping').send(novaReserva())
    expect(resposta.status).toBe(409)
    expect(resposta.body.erro).toBe('Não há tarifa ativa neste cliente. Ative uma tarifa antes de reservar.')
    expect(statusDaVaga('A-01')).toBe('Livre')
  })
})

describe('API de reservas — Observer no fluxo', () => {
  it('a confirmação passa por EventosReserva e pelo ObservadorVagaReserva', async () => {
    const confirmar = vi.spyOn(EventosReserva.prototype, 'confirmar')
    const observadorVaga = vi.spyOn(ObservadorVagaReserva.prototype, 'atualizar')
    await request(app).post('/api/reservations?tenant=shopping').send(novaReserva())
    expect(confirmar).toHaveBeenCalledTimes(1)
    expect(observadorVaga).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'confirmada' }))
  })

  it('o cancelamento passa por EventosReserva e pelo ObservadorVagaReserva', async () => {
    const cancelar = vi.spyOn(EventosReserva.prototype, 'cancelar')
    const observadorVaga = vi.spyOn(ObservadorVagaReserva.prototype, 'atualizar')
    await request(app).put(`/api/reservations/${idDaReserva('confirmada')}/cancel?tenant=shopping`)
    expect(cancelar).toHaveBeenCalledTimes(1)
    expect(observadorVaga).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'cancelada' }))
  })

  it('com notifications ligada, o ObservadorNotificacaoReserva é registrado', async () => {
    const observadorNotificacao = vi.spyOn(ObservadorNotificacaoReserva.prototype, 'atualizar')
    const resposta = await request(app).post('/api/reservations?tenant=shopping').send(novaReserva())
    expect(observadorNotificacao).toHaveBeenCalledTimes(1)
    expect(resposta.body.notifications).toHaveLength(1)
  })

  it('com notifications desligada, só o observador da vaga participa', async () => {
    vi.spyOn(VARIANTE_POR_TENANT.shopping, 'possuiFeature').mockImplementation((feature) => feature !== 'notifications')
    const observadorNotificacao = vi.spyOn(ObservadorNotificacaoReserva.prototype, 'atualizar')
    const resposta = await request(app).post('/api/reservations?tenant=shopping').send(novaReserva())
    expect(resposta.status).toBe(201)
    expect(resposta.body.notifications).toEqual([])
    expect(observadorNotificacao).not.toHaveBeenCalled()
    expect(statusDaVaga('A-01')).toBe('Reservada')
  })
})

describe('API de reservas — vagas e concorrência', () => {
  it('recusa vaga Ocupada ou já Reservada', async () => {
    const ocupada = await request(app).post('/api/reservations?tenant=shopping').send(novaReserva('A-02'))
    const reservada = await request(app).post('/api/reservations?tenant=shopping').send(novaReserva('A-03'))
    expect(ocupada.status).toBe(409)
    expect(ocupada.body.erro).toBe('A vaga A-02 não está livre para reserva (status: Ocupada).')
    expect(reservada.status).toBe(409)
    expect(db.prepare('SELECT COUNT(*) AS total FROM reservas').get()).toEqual({ total: 3 })
  })

  it('a segunda reserva para a mesma vaga é recusada', async () => {
    const primeira = await request(app).post('/api/reservations?tenant=shopping').send(novaReserva('B-13'))
    const segunda = await request(app).post('/api/reservations?tenant=shopping').send(novaReserva('B-13'))
    expect(primeira.status).toBe(201)
    expect(segunda.status).toBe(409)
  })

  it('o próprio banco recusa duas reservas confirmadas na mesma vaga', () => {
    const vaga = idDaVaga('A-03')
    expect(() => db.prepare("INSERT INTO reservas (tenant_id, veiculo_id, vaga_id, data, hora, duracao_horas, status) VALUES ('shopping', 1, ?, '2026-12-01', '10:00', 1, 'confirmada')").run(vaga)).toThrow(/UNIQUE/)
  })

  it('não altera nem cancela de novo uma reserva cancelada', async () => {
    const id = idDaReserva('cancelada')
    const alteracao = await request(app).put(`/api/reservations/${id}?tenant=shopping`).send({ date: '2026-12-21', time: '20:00', duration: 4 })
    const cancelamento = await request(app).put(`/api/reservations/${id}/cancel?tenant=shopping`)
    expect(alteracao.body.erro).toBe('Apenas reservas pendentes ou confirmadas podem ser alteradas.')
    expect(cancelamento.body.erro).toBe('Uma reserva cancelada não pode ser cancelada.')
  })

  it('a seed deixa reservas confirmadas e vagas Reservadas coerentes', () => {
    const vagasReservadas = db.prepare("SELECT codigo FROM vagas WHERE status = 'Reservada'").all()
    const vagasDeReservasConfirmadas = db.prepare("SELECT g.codigo FROM reservas r JOIN vagas g ON g.id = r.vaga_id WHERE r.status = 'confirmada'").all()
    expect(vagasDeReservasConfirmadas).toEqual(vagasReservadas)
  })

  it('veículo ou vaga com reservas não podem ser excluídos (foreign key)', async () => {
    const veiculo = await request(app).delete(`/api/vehicles/${idDoVeiculo('BRA2E19')}?tenant=shopping`)
    const vaga = await request(app).delete(`/api/spaces/${idDaVaga('B-11')}?tenant=shopping`)
    expect(veiculo.status).toBe(409)
    expect(veiculo.body.erro).toBe('Este veículo possui reservas. Exclua as reservas dele antes.')
    expect(vaga.status).toBe(409)
    expect(vaga.body.erro).toBe('A vaga B-11 possui reservas registradas. Exclua as reservas dela antes.')
  })
})

describe('API de reservas — tenant e feature reservation', () => {
  it('exige um tenant válido', async () => {
    expect((await request(app).get('/api/reservations')).status).toBe(400)
    expect((await request(app).get('/api/reservations?tenant=aeroporto')).status).toBe(400)
  })

  it('bloqueia tenants com reservation desligado', async () => {
    const leitura = await request(app).get('/api/reservations?tenant=hospital')
    const criacao = await request(app).post('/api/reservations?tenant=condominium').send(novaReserva())
    expect(leitura.status).toBe(403)
    expect(leitura.body.erro).toBe('O módulo Reserva não está disponível para Hospital Santa Clara.')
    expect(criacao.status).toBe(403)
  })

  describe('isolamento (simulando um segundo tenant com reservation ligado)', () => {
    beforeEach(() => { TENANTS.hospital.features.reservation = true })
    afterEach(() => { TENANTS.hospital.features.reservation = false })

    it('não reserva veículo de outro tenant', async () => {
      const corpo = { ...novaReserva(), spaceId: String(idDaVaga('P-02', 'hospital')) } // veículo do Shopping
      const resposta = await request(app).post('/api/reservations?tenant=hospital').send(corpo)
      expect(resposta.status).toBe(400)
      expect(resposta.body.erro).toBe('Veículo não encontrado neste cliente.')
    })

    it('não reserva vaga de outro tenant', async () => {
      const corpo = { ...novaReserva(), spaceId: String(idDaVaga('P-02', 'hospital')) } // vaga do Hospital
      const resposta = await request(app).post('/api/reservations?tenant=shopping').send(corpo)
      expect(resposta.status).toBe(400)
      expect(resposta.body.erro).toBe('Vaga não encontrada neste cliente.')
    })

    it('não lista, altera, cancela nem exclui reserva de outro tenant', async () => {
      const id = idDaReserva('confirmada') // pertence ao Shopping
      const lista = await request(app).get('/api/reservations?tenant=hospital')
      const alteracao = await request(app).put(`/api/reservations/${id}?tenant=hospital`).send({ date: '2026-12-21', time: '20:00', duration: 4 })
      const cancelamento = await request(app).put(`/api/reservations/${id}/cancel?tenant=hospital`)
      const exclusao = await request(app).delete(`/api/reservations/${idDaReserva('cancelada')}?tenant=hospital`)
      expect(lista.body).toEqual([])
      expect([alteracao.status, cancelamento.status, exclusao.status]).toEqual([404, 404, 404])
      expect(reservaPorId(id)).toMatchObject({ status: 'confirmada', duracao_horas: 2 })
    })
  })
})

describe('API de reservas — validações e reset', () => {
  it('valida data, horário e duração', async () => {
    const data = await request(app).post('/api/reservations?tenant=shopping').send(novaReserva('A-01', { date: '20/12/2026' }))
    const hora = await request(app).post('/api/reservations?tenant=shopping').send(novaReserva('A-01', { time: '9h' }))
    const duracoes = await Promise.all([0, 25, 1.5].map((duration) => request(app).post('/api/reservations?tenant=shopping').send(novaReserva('A-01', { duration }))))
    expect(data.body.erro).toBe('Informe a data no formato AAAA-MM-DD.')
    expect(hora.body.erro).toBe('Informe o horário no formato HH:MM.')
    duracoes.forEach((resposta) => expect(resposta.body.erro).toBe('A duração deve ser um número inteiro de 1 a 24 horas.'))
  })

  it('/api/reset restaura as reservas e as vagas coerentes', async () => {
    const id = idDaReserva('confirmada')
    await request(app).put(`/api/reservations/${id}/cancel?tenant=shopping`)
    await request(app).delete(`/api/reservations/${id}?tenant=shopping`)
    expect(statusDaVaga('A-03')).toBe('Livre')

    await request(app).post('/api/reset')
    expect(db.prepare('SELECT COUNT(*) AS total FROM reservas').get()).toEqual({ total: 3 })
    expect(statusDaVaga('A-03')).toBe('Reservada')
    expect(reservaPorId(1)).toMatchObject({ status: 'confirmada', valor_estimado: 24 })
  })
})
