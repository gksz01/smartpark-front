import type { EstrategiaTarifa } from './EstrategiaTarifa'
import { formatarMoeda } from '../../formatacao'

/** Estratégia concreta: cobra por hora iniciada, com teto diário opcional (Shopping). */
export class TarifaPorHora implements EstrategiaTarifa {
  valorHora: number
  valorMaximoDiario?: number

  constructor(valorHora: number, valorMaximoDiario?: number) {
    this.valorHora = valorHora
    this.valorMaximoDiario = valorMaximoDiario
  }

  /** Ex.: 2h10min são cobradas como 3 horas. */
  calcular(duracaoHoras: number): number {
    if (duracaoHoras <= 0) return 0
    const valor = Math.ceil(duracaoHoras) * this.valorHora
    if (this.valorMaximoDiario !== undefined) return Math.min(valor, this.valorMaximoDiario)
    return valor
  }

  descricao(): string {
    const texto = `${formatarMoeda(this.valorHora)}/hora`
    if (this.valorMaximoDiario === undefined) return texto
    return `${texto} (máx. ${formatarMoeda(this.valorMaximoDiario)}/dia)`
  }
}
