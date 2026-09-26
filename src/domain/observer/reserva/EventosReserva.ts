import type { Reserva } from '../../Reserva'
import { Observable } from '../Observable'

/** Evento emitido quando algo acontece com uma reserva. */
export interface EventoReserva {
  tipo: 'confirmada' | 'alterada' | 'cancelada'
  reserva: Reserva
}

/**
 * OBSERVER — Exemplo 2: Subject dos eventos de reserva.
 *
 * Executa a operação na Reserva e, se ela for bem-sucedida, avisa os observadores.
 * A classe Reserva continua sem conhecer nenhum observador.
 */
export class EventosReserva extends Observable<EventoReserva> {
  confirmar(reserva: Reserva): void {
    reserva.confirmar()
    this.notificar({ tipo: 'confirmada', reserva })
  }

  alterar(reserva: Reserva, data: string, hora: string, duracaoHoras: number): void {
    reserva.alterar(data, hora, duracaoHoras)
    this.notificar({ tipo: 'alterada', reserva })
  }

  cancelar(reserva: Reserva): void {
    reserva.cancelar()
    this.notificar({ tipo: 'cancelada', reserva })
  }
}
