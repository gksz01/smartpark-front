import type { Estacionamento } from '../Estacionamento'
import type { VarianteSmartPark } from '../factories/variante/VarianteSmartPark'
import type { Notificacao } from '../Notificacao'
import type { Sensor } from '../Sensor'
import type { Vaga } from '../Vaga'
import { EventosReserva } from './reserva/EventosReserva'
import { ObservadorNotificacaoReserva } from './reserva/ObservadorNotificacaoReserva'
import { ObservadorVagaReserva } from './reserva/ObservadorVagaReserva'
import { ObservadorNotificacaoSensor } from './sensor/ObservadorNotificacaoSensor'
import { ObservadorVagaSensor } from './sensor/ObservadorVagaSensor'

/*
 * Montagem dos observers para uma variante da LPS.
 *
 * O "if" da feature flag NÃO faz parte do padrão Observer: ele apenas decide
 * se o observador de notificação participa desta variante. O Observable
 * continua sem nenhuma verificação de feature.
 */

export function registrarObservadoresSensor(sensor: Sensor, vaga: Vaga, variante: VarianteSmartPark, notificacoes: Notificacao[]): void {
  sensor.inscrever(new ObservadorVagaSensor(vaga))
  if (variante.possuiFeature('notifications')) {
    sensor.inscrever(new ObservadorNotificacaoSensor(notificacoes))
  }
}

export function criarEventosReserva(estacionamento: Estacionamento, variante: VarianteSmartPark, notificacoes: Notificacao[]): EventosReserva {
  const eventos = new EventosReserva()
  eventos.inscrever(new ObservadorVagaReserva(estacionamento))
  if (variante.possuiFeature('notifications')) {
    eventos.inscrever(new ObservadorNotificacaoReserva(notificacoes))
  }
  return eventos
}
