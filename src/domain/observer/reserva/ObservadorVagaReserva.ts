import type { Estacionamento } from '../../Estacionamento'
import type { Observador } from '../Observador'
import type { EventoReserva } from './EventosReserva'

/**
 * Observer concreto das reservas: atualiza o status da vaga reservada.
 * Recebe o Estacionamento porque uma reserva pode ser feita para qualquer uma das suas vagas.
 */
export class ObservadorVagaReserva implements Observador<EventoReserva> {
  estacionamento: Estacionamento

  constructor(estacionamento: Estacionamento) {
    this.estacionamento = estacionamento
  }

  atualizar(evento: EventoReserva): void {
    const vaga = this.estacionamento.vagas.find((item) => item.id === evento.reserva.vagaId)
    if (!vaga) return

    if (evento.tipo === 'confirmada') vaga.reservar()
    // Só libera se a vaga ainda estiver reservada (o veículo pode já ter entrado).
    if (evento.tipo === 'cancelada' && vaga.status === 'Reservada') vaga.liberar()
  }
}
