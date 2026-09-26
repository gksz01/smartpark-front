/**
 * OBSERVER — contrato do observador.
 *
 * Todo objeto interessado em um evento implementa atualizar().
 * O tipo E é o evento recebido (por exemplo, EventoSensor ou EventoReserva).
 */
export interface Observador<E> {
  atualizar(evento: E): void
}
