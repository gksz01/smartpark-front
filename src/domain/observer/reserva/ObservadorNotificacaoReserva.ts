import { Notificacao } from '../../Notificacao'
import type { Observador } from '../Observador'
import type { EventoReserva } from './EventosReserva'

/** Observer concreto das reservas: registra uma Notificacao para cada acontecimento. */
export class ObservadorNotificacaoReserva implements Observador<EventoReserva> {
  notificacoes: Notificacao[]

  /** A lista fica em memória e pode ser compartilhada com outros observadores. */
  constructor(notificacoes: Notificacao[] = []) {
    this.notificacoes = notificacoes
  }

  atualizar(evento: EventoReserva): void {
    const id = `n-${this.notificacoes.length + 1}`
    const { reserva } = evento
    if (evento.tipo === 'confirmada') {
      this.notificacoes.push(new Notificacao(id, 'Reserva confirmada', `Reserva confirmada para a vaga ${reserva.vagaId}.`, 'sucesso'))
    }
    if (evento.tipo === 'alterada') {
      this.notificacoes.push(new Notificacao(id, 'Reserva alterada', `Nova data: ${reserva.data} às ${reserva.hora}, por ${reserva.duracaoHoras}h.`, 'info'))
    }
    if (evento.tipo === 'cancelada') {
      this.notificacoes.push(new Notificacao(id, 'Reserva cancelada', `Reserva cancelada. A vaga ${reserva.vagaId} foi liberada.`, 'alerta'))
    }
  }
}
