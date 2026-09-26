import { describe, expect, it } from 'vitest'
import { Notificacao, ObservadorNotificacaoSensor, ObservadorVagaSensor, Sensor, VagaComum, type EventoSensor, type Observador } from '../..'

function montarCenario() {
  const vaga = new VagaComum('A-01', 'A-01', 'A')
  const sensor = new Sensor('s-1', 'SN-A01', vaga.id)
  const notificacoes: Notificacao[] = []
  const observadorVaga = new ObservadorVagaSensor(vaga)
  const observadorNotificacao = new ObservadorNotificacaoSensor(notificacoes)
  return { vaga, sensor, notificacoes, observadorVaga, observadorNotificacao }
}

describe('Observer — Exemplo 1: Sensor e ocupação da vaga', () => {
  it('inscreve os observers no Sensor (Subject)', () => {
    const { sensor, observadorVaga, observadorNotificacao } = montarCenario()
    expect(sensor.quantidadeObservadores()).toBe(0)

    sensor.inscrever(observadorVaga)
    sensor.inscrever(observadorNotificacao)
    sensor.inscrever(observadorVaga) // inscrição repetida é ignorada

    expect(sensor.quantidadeObservadores()).toBe(2)
  })

  it('ao detectar ocupação, a vaga fica Ocupada e uma notificação é gerada', () => {
    const { vaga, sensor, notificacoes, observadorVaga, observadorNotificacao } = montarCenario()
    sensor.inscrever(observadorVaga)
    sensor.inscrever(observadorNotificacao)

    sensor.detectarOcupacao(new Date(2026, 8, 5, 14, 32))

    expect(vaga.status).toBe('Ocupada')
    expect(notificacoes).toHaveLength(1)
    expect(notificacoes[0].formatar()).toBe('[14:32] Vaga ocupada: O sensor SN-A01 detectou um veículo na vaga A-01.')
  })

  it('ao detectar liberação, a vaga volta para Livre e outra notificação é gerada', () => {
    const { vaga, sensor, notificacoes, observadorVaga, observadorNotificacao } = montarCenario()
    sensor.inscrever(observadorVaga)
    sensor.inscrever(observadorNotificacao)

    sensor.detectarOcupacao()
    sensor.detectarLiberacao()

    expect(vaga.status).toBe('Livre')
    expect(notificacoes.map((notificacao) => notificacao.titulo)).toEqual(['Vaga ocupada', 'Vaga liberada'])
  })

  it('leitura repetida sem mudança de estado não notifica', () => {
    const { sensor, notificacoes, observadorNotificacao } = montarCenario()
    sensor.inscrever(observadorNotificacao)

    sensor.detectarOcupacao()
    sensor.detectarOcupacao()

    expect(notificacoes).toHaveLength(1)
  })

  it('observer desinscrito deixa de receber eventos', () => {
    const { vaga, sensor, notificacoes, observadorVaga, observadorNotificacao } = montarCenario()
    sensor.inscrever(observadorVaga)
    sensor.inscrever(observadorNotificacao)
    sensor.detectarOcupacao()

    sensor.desinscrever(observadorNotificacao)
    sensor.detectarLiberacao()

    expect(vaga.status).toBe('Livre') // o observer da vaga continua inscrito
    expect(notificacoes).toHaveLength(1) // só a notificação de antes da desinscrição
    expect(sensor.quantidadeObservadores()).toBe(1)
  })

  it('o Sensor aceita qualquer objeto que implemente Observador', () => {
    const { sensor } = montarCenario()
    const recebidos: string[] = []
    const painel: Observador<EventoSensor> = { atualizar: (evento) => recebidos.push(evento.tipo) }
    sensor.inscrever(painel)

    sensor.detectarOcupacao()
    sensor.detectarLiberacao()

    expect(recebidos).toEqual(['ocupada', 'liberada'])
  })
})
