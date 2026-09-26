import type { Convenio } from '../../Convenio'
import type { EstrategiaTarifa } from './EstrategiaTarifa'

/**
 * Estratégia concreta: aplica o benefício de um convênio médico (Hospital)
 * sobre uma estratégia base, por exemplo TarifaPorHora.
 */
export class TarifaComConvenio implements EstrategiaTarifa {
  estrategiaBase: EstrategiaTarifa
  convenio: Convenio

  constructor(estrategiaBase: EstrategiaTarifa, convenio: Convenio) {
    this.estrategiaBase = estrategiaBase
    this.convenio = convenio
  }

  calcular(duracaoHoras: number): number {
    return this.convenio.aplicarBeneficio(this.estrategiaBase, duracaoHoras)
  }

  descricao(): string {
    return `${this.estrategiaBase.descricao()} com convênio ${this.convenio.nome} (${this.convenio.descricaoBeneficio()})`
  }
}
