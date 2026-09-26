import type { Observador } from './Observador'

/**
 * OBSERVER — Subject genérico e reutilizável.
 *
 * Guarda a lista de observadores e avisa todos quando um evento acontece.
 * Não sabe quem são os observadores nem o que eles fazem com o evento.
 * É reutilizado por Sensor (Exemplo 1) e por EventosReserva (Exemplo 2).
 */
export abstract class Observable<E> {
  private observadores: Observador<E>[] = []

  /** Adiciona um observador (ignorando se ele já estiver inscrito). */
  inscrever(observador: Observador<E>): void {
    if (!this.observadores.includes(observador)) {
      this.observadores.push(observador)
    }
  }

  /** Remove o observador: ele deixa de receber eventos. */
  desinscrever(observador: Observador<E>): void {
    this.observadores = this.observadores.filter((item) => item !== observador)
  }

  quantidadeObservadores(): number {
    return this.observadores.length
  }

  /** Entrega o evento a cada observador inscrito, na ordem de inscrição. */
  protected notificar(evento: E): void {
    this.observadores.forEach((observador) => observador.atualizar(evento))
  }
}
