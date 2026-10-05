import { createFakeCrudApi } from './createFakeCrudApi'
import type { Tariff, TenantId } from '../core/types'
import type { TariffInput } from '../services/tariffsApi'

/*
 * Substitui src/services/tariffsApi.ts nos testes de interface (ver setup.ts),
 * guardando as tarifas em memória por tenant e mantendo no máximo uma ativa.
 * O backend real é testado em server/.
 */

const INITIAL: Record<TenantId, Tariff[]> = {
  shopping: [
    { id: '1', name: 'Tarifa Aurora', strategy: 'POR_HORA', value: 12, maxDaily: 60, active: true },
    { id: '3', name: 'Diária promocional', strategy: 'DIARIA', value: 40, maxDaily: null, active: false },
    { id: '4', name: 'Cortesia para lojistas', strategy: 'ISENTA', value: 0, maxDaily: null, active: false },
  ],
  hospital: [{ id: '2', name: 'Tarifa Santa Clara', strategy: 'POR_HORA', value: 10, maxDaily: 50, active: true }],
  condominium: [],
  company: [],
}

// Como a API real: ativar uma tarifa desativa as demais
const tariffs = createFakeCrudApi<Tariff, TariffInput>(INITIAL, {
  beforeSave: (items, input) => input.active ? items.map((tariff) => ({ ...tariff, active: false })) : items,
})

export const resetFakeTariffs = tariffs.reset
export const listTariffs = tariffs.list
export const createTariff = tariffs.create
export const updateTariff = tariffs.update
export const deleteTariff = tariffs.remove
