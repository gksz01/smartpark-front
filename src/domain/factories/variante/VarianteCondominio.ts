import type { EstrategiaTarifa } from '../../strategies/tarifa/EstrategiaTarifa'
import { TarifaIsenta } from '../../strategies/tarifa/TarifaIsenta'
import { VagaNominal } from '../../vagas/VagaNominal'
import { VarianteSmartPark } from './VarianteSmartPark'

/** Creator concreto: Condomínio não cobra e usa vagas nominais (vinculadas à unidade). */
export class VarianteCondominio extends VarianteSmartPark {
  constructor() {
    super('condominium')
  }

  /** Coerente com billing=false no Condomínio. */
  criarEstrategiaTarifa(): EstrategiaTarifa {
    return new TarifaIsenta()
  }

  criarVagaPadrao(id: string, codigo: string, setor: string): VagaNominal {
    return new VagaNominal(id, codigo, setor)
  }
}
