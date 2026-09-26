import type { Convenio } from '../../Convenio'
import type { EstrategiaTarifa } from '../../strategies/tarifa/EstrategiaTarifa'
import { TarifaComConvenio } from '../../strategies/tarifa/TarifaComConvenio'
import { TarifaPorHora } from '../../strategies/tarifa/TarifaPorHora'
import { VagaPrioritaria } from '../../vagas/VagaPrioritaria'
import { VarianteSmartPark } from './VarianteSmartPark'

/** Creator concreto: Hospital cobra por hora, aceita convênio médico e usa vagas prioritárias. */
export class VarianteHospital extends VarianteSmartPark {
  constructor() {
    super('hospital')
  }

  /**
   * O convênio só é aplicado se a feature medicalAgreement estiver
   * ligada em TENANTS: a variabilidade continua vindo de config.ts.
   */
  criarEstrategiaTarifa(convenio?: Convenio): EstrategiaTarifa {
    const tarifaBase = new TarifaPorHora(10, 50)
    if (convenio && this.possuiFeature('medicalAgreement')) {
      return new TarifaComConvenio(tarifaBase, convenio)
    }
    return tarifaBase
  }

  criarVagaPadrao(id: string, codigo: string, setor: string): VagaPrioritaria {
    return new VagaPrioritaria(id, codigo, setor)
  }
}
