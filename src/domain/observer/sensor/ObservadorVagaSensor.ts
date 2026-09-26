import type { EventoSensor } from '../../Sensor'
import type { Vaga } from '../../Vaga'
import type { Observador } from '../Observador'

/**
 * Observer concreto do Sensor: mantém o status da Vaga igual ao que o sensor detectou.
 * Recebe uma única vaga porque o sensor fica instalado fisicamente nela.
 */
export class ObservadorVagaSensor implements Observador<EventoSensor> {
  vaga: Vaga

  constructor(vaga: Vaga) {
    this.vaga = vaga
  }

  atualizar(evento: EventoSensor): void {
    if (evento.tipo === 'ocupada') this.vaga.ocupar()
    else this.vaga.liberar()
  }
}
