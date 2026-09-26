import type { EstrategiaTarifa } from './strategies/tarifa/EstrategiaTarifa'

/**
 * STRATEGY — Context do exemplo de tarifa.
 *
 * A Tarifa não decide como o preço é calculado: ela guarda uma
 * EstrategiaTarifa e delega o cálculo para ela. Trocar a estratégia
 * muda o algoritmo sem alterar esta classe.
 */
export class Tarifa {
  id: string
  nome: string
  estrategia: EstrategiaTarifa

  constructor(id: string, nome: string, estrategia: EstrategiaTarifa) {
    this.id = id
    this.nome = nome
    this.estrategia = estrategia
  }

  definirEstrategia(estrategia: EstrategiaTarifa): void {
    this.estrategia = estrategia
  }

  calcular(duracaoHoras: number): number {
    return this.estrategia.calcular(duracaoHoras)
  }

  descricao(): string {
    return `${this.nome}: ${this.estrategia.descricao()}`
  }
}
