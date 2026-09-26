import { describe, expect, it, vi } from 'vitest'
import { TENANT_ORDER, TENANTS } from '../../../core/config'
import {
  criarEventosReserva, Estacionamento, EventosReserva, Notificacao, ObservadorNotificacaoReserva, ObservadorVagaReserva,
  registrarObservadoresSensor, Reserva, Sensor, VagaComum, VarianteShopping, type EventoReserva, type Observador,
} from '../..'

function montarCenario() {
  const vaga = new VagaComum('A-01', 'A-01', 'A')
  const estacionamento = new Estacionamento('central', 'Estacionamento Central', 'Av. das Palmeiras, 450', true, false, [vaga])
  const reserva = new Reserva('r-1', 'v-1', vaga.id, '2026-09-05', '18:30', 2)
  const notificacoes: Notificacao[] = []
  const eventos = new EventosReserva()
  eventos.inscrever(new ObservadorVagaReserva(estacionamento))
  eventos.inscrever(new ObservadorNotificacaoReserva(notificacoes))
  return { vaga, estacionamento, reserva, notificacoes, eventos }
}

describe('Observer — Exemplo 2: eventos de Reserva', () => {
  it('os dois observers ficam inscritos em EventosReserva', () => {
    const { eventos } = montarCenario()
    expect(eventos.quantidadeObservadores()).toBe(2)
  })

  it('ao confirmar, a vaga fica Reservada e uma notificação é criada', () => {
    const { vaga, reserva, notificacoes, eventos } = montarCenario()

    eventos.confirmar(reserva)

    expect(reserva.status).toBe('confirmada')
    expect(vaga.status).toBe('Reservada')
    expect(notificacoes[0].mensagem).toBe('Reserva confirmada para a vaga A-01.')
  })

  it('ao cancelar, a vaga volta para Livre e a notificação de cancelamento é criada', () => {
    const { vaga, reserva, notificacoes, eventos } = montarCenario()
    eventos.confirmar(reserva)

    eventos.cancelar(reserva)

    expect(reserva.status).toBe('cancelada')
    expect(vaga.status).toBe('Livre')
    expect(notificacoes[1].mensagem).toBe('Reserva cancelada. A vaga A-01 foi liberada.')
    expect(notificacoes[1].ehAlerta()).toBe(true)
  })

  it('cancelar não libera uma vaga que o veículo já ocupou', () => {
    const { vaga, reserva, eventos } = montarCenario()
    eventos.confirmar(reserva)
    vaga.ocupar()

    eventos.cancelar(reserva)

    expect(vaga.status).toBe('Ocupada')
  })

  it('a alteração notifica sem mudar o status da vaga', () => {
    const { vaga, reserva, notificacoes, eventos } = montarCenario()
    eventos.confirmar(reserva)

    eventos.alterar(reserva, '2026-09-06', '10:00', 4)

    expect(vaga.status).toBe('Reservada')
    expect(notificacoes[1].mensagem).toBe('Nova data: 2026-09-06 às 10:00, por 4h.')
  })

  it('dois observers recebem o mesmo evento, sem a Reserva conhecê-los', () => {
    const { reserva } = montarCenario()
    const eventos = new EventosReserva()
    const recebidosA: EventoReserva[] = []
    const recebidosB: EventoReserva[] = []
    const observadorA: Observador<EventoReserva> = { atualizar: (evento) => recebidosA.push(evento) }
    const observadorB: Observador<EventoReserva> = { atualizar: (evento) => recebidosB.push(evento) }
    eventos.inscrever(observadorA)
    eventos.inscrever(observadorB)

    eventos.confirmar(reserva)

    expect(recebidosA[0]).toBe(recebidosB[0]) // o mesmo objeto de evento
    expect(recebidosA[0]).toEqual({ tipo: 'confirmada', reserva })
    expect(Object.keys(reserva)).not.toContain('observadores') // Reserva não guarda observers
  })

  it('se a operação falhar, nenhum observer é notificado', () => {
    const { reserva, notificacoes, eventos } = montarCenario()
    eventos.confirmar(reserva)
    eventos.cancelar(reserva)

    expect(() => eventos.cancelar(reserva)).toThrow('não pode ser cancelada')
    expect(notificacoes).toHaveLength(2)
  })
})

describe('Observer — feature flag notifications controla o registro do observer', () => {
  it('todas as variantes atuais têm notifications ligada em TENANTS', () => {
    expect(TENANT_ORDER.every((id) => TENANTS[id].features.notifications)).toBe(true)
  })

  it('com notifications=true, o observer de notificação é registrado', () => {
    const { estacionamento, reserva } = montarCenario()
    const notificacoes: Notificacao[] = []

    const eventos = criarEventosReserva(estacionamento, new VarianteShopping(), notificacoes)
    eventos.confirmar(reserva)

    expect(eventos.quantidadeObservadores()).toBe(2)
    expect(notificacoes).toHaveLength(1)
  })

  it('com notifications=false, apenas o observer da vaga é registrado', () => {
    const { vaga, estacionamento, reserva } = montarCenario()
    const notificacoes: Notificacao[] = []
    // Simula uma variante com a flag desligada (nenhum tenant atual tem essa combinação).
    const variante = new VarianteShopping()
    vi.spyOn(variante, 'possuiFeature').mockImplementation((feature) => feature !== 'notifications')

    const eventos = criarEventosReserva(estacionamento, variante, notificacoes)
    eventos.confirmar(reserva)

    expect(eventos.quantidadeObservadores()).toBe(1)
    expect(vaga.status).toBe('Reservada') // a vaga continua sendo atualizada
    expect(notificacoes).toHaveLength(0)
  })

  it('a mesma regra vale para o Sensor', () => {
    const vaga = new VagaComum('A-01', 'A-01', 'A')
    const ligado = new Sensor('s-1', 'SN-A01', vaga.id)
    const desligado = new Sensor('s-2', 'SN-A02', vaga.id)
    const varianteSemNotificacao = new VarianteShopping()
    vi.spyOn(varianteSemNotificacao, 'possuiFeature').mockReturnValue(false)

    registrarObservadoresSensor(ligado, vaga, new VarianteShopping(), [])
    registrarObservadoresSensor(desligado, vaga, varianteSemNotificacao, [])

    expect(ligado.quantidadeObservadores()).toBe(2)
    expect(desligado.quantidadeObservadores()).toBe(1)
  })
})
