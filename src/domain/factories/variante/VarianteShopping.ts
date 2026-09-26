import type { EstrategiaTarifa } from '../../strategies/tarifa/EstrategiaTarifa'
import { TarifaPorHora } from '../../strategies/tarifa/TarifaPorHora'
import { VagaComum } from '../../vagas/VagaComum'
import { VarianteSmartPark } from './VarianteSmartPark'

/** Creator concreto: Shopping cobra por hora e usa vagas comuns. */
export class VarianteShopping extends VarianteSmartPark {
  constructor() {
    super('shopping')
  }

  /** Mesmo valor por hora do Estacionamento Central (R$ 12), com teto diário. */
  criarEstrategiaTarifa(): EstrategiaTarifa {
    return new TarifaPorHora(12, 60)
  }

  criarVagaPadrao(id: string, codigo: string, setor: string): VagaComum {
    return new VagaComum(id, codigo, setor)
  }
}
