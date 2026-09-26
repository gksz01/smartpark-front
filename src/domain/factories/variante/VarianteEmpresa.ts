import type { EstrategiaTarifa } from '../../strategies/tarifa/EstrategiaTarifa'
import { TarifaIsenta } from '../../strategies/tarifa/TarifaIsenta'
import { VagaComum } from '../../vagas/VagaComum'
import { VarianteSmartPark } from './VarianteSmartPark'

/** Creator concreto: Empresa não cobra dos funcionários e usa vagas comuns. */
export class VarianteEmpresa extends VarianteSmartPark {
  constructor() {
    super('company')
  }

  /** Coerente com billing=false na Empresa. */
  criarEstrategiaTarifa(): EstrategiaTarifa {
    return new TarifaIsenta()
  }

  criarVagaPadrao(id: string, codigo: string, setor: string): VagaComum {
    return new VagaComum(id, codigo, setor)
  }
}
