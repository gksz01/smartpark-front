import type { TenantId } from '../../../core/types'
import { VarianteCondominio } from './VarianteCondominio'
import { VarianteEmpresa } from './VarianteEmpresa'
import { VarianteHospital } from './VarianteHospital'
import { VarianteShopping } from './VarianteShopping'
import type { VarianteSmartPark } from './VarianteSmartPark'

/**
 * Qual variante (Creator do Factory Method) representa cada tenant.
 * Só escolhe a subclasse; os Factory Methods continuam em cada variante.
 */
export const VARIANTE_POR_TENANT: Record<TenantId, VarianteSmartPark> = {
  shopping: new VarianteShopping(),
  condominium: new VarianteCondominio(),
  hospital: new VarianteHospital(),
  company: new VarianteEmpresa(),
}
