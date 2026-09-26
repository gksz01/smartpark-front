import type { EstrategiaTarifa } from './EstrategiaTarifa'

const HORAS_POR_DIA = 24

/** Estratégia concreta: valor único por dia iniciado, independente das horas (diária). */
export class TarifaFixaDiaria implements EstrategiaTarifa {
  valorDiaria: number

  constructor(valorDiaria: number) {
    this.valorDiaria = valorDiaria
  }

  /** Ex.: 3 horas = 1 diária; 30 horas = 2 diárias. */
  calcular(duracaoHoras: number): number {
    if (duracaoHoras <= 0) return 0
    return Math.ceil(duracaoHoras / HORAS_POR_DIA) * this.valorDiaria
  }

  descricao(): string {
    return `R$ ${this.valorDiaria.toFixed(2).replace('.', ',')}/dia`
  }
}
