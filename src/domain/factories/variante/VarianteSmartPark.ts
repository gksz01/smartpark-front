import { TENANTS } from '../../../core/config'
import type { Feature, TenantConfig, TenantId } from '../../../core/types'
import type { Convenio } from '../../Convenio'
import type { EstrategiaTarifa } from '../../strategies/tarifa/EstrategiaTarifa'
import { Tarifa } from '../../Tarifa'
import type { Vaga } from '../../Vaga'

/**
 * FACTORY METHOD — Exemplo 2: variantes da Linha de Produto SmartPark.
 *
 * Creator abstrato. Cada variante (Shopping, Hospital, Condomínio, Empresa)
 * decide QUAIS objetos de domínio criar, sobrescrevendo os Factory Methods.
 *
 * Flags, perfis, tema e campos continuam vindo de TENANTS (core/config.ts):
 * esta classe apenas consulta essa configuração, sem duplicá-la.
 */
export abstract class VarianteSmartPark {
  tenantId: TenantId

  constructor(tenantId: TenantId) {
    this.tenantId = tenantId
  }

  /** Configuração da variante: o mesmo objeto de TENANTS, sem cópia. */
  configuracao(): TenantConfig {
    return TENANTS[this.tenantId]
  }

  possuiFeature(feature: Feature): boolean {
    return this.configuracao().features[feature]
  }

  /** Factory Method: qual estratégia de tarifa esta variante utiliza. */
  abstract criarEstrategiaTarifa(convenio?: Convenio): EstrategiaTarifa

  /** Factory Method: qual tipo de vaga é o padrão desta variante. */
  abstract criarVagaPadrao(id: string, codigo: string, setor: string): Vaga

  /**
   * Operação comum a todas as variantes. Usa o Factory Method para obter
   * a estratégia e monta a Tarifa (Context do Strategy) com ela.
   */
  criarTarifa(id: string, convenio?: Convenio): Tarifa {
    return new Tarifa(id, `Tarifa ${this.configuracao().shortName}`, this.criarEstrategiaTarifa(convenio))
  }
}
