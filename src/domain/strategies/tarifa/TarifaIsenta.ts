import type { EstrategiaTarifa } from './EstrategiaTarifa'

/** Estratégia concreta: sem cobrança (clientes com billing desligado, como Condomínio e Empresa). */
export class TarifaIsenta implements EstrategiaTarifa {
  calcular(): number {
    return 0
  }

  descricao(): string {
    return 'Isento de cobrança'
  }
}
