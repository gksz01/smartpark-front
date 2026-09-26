/**
 * STRATEGY — Exemplo 1: cálculo de tarifa.
 *
 * Contrato comum a todos os algoritmos de cálculo de preço.
 * A classe Tarifa (Context) conhece apenas esta interface,
 * e não sabe qual algoritmo concreto está sendo usado.
 */
export interface EstrategiaTarifa {
  calcular(duracaoHoras: number): number
  descricao(): string
}
