import { vi } from 'vitest'
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

let tariffs = structuredClone(INITIAL)
let nextId = 100

export function resetFakeTariffs() {
  tariffs = structuredClone(INITIAL)
  nextId = 100
}

function deactivateOthers(tenantId: TenantId, input: TariffInput) {
  if (input.active) tariffs[tenantId] = tariffs[tenantId].map((tariff) => ({ ...tariff, active: false }))
}

export const listTariffs = vi.fn(async (tenantId: TenantId) => tariffs[tenantId])

export const createTariff = vi.fn(async (tenantId: TenantId, input: TariffInput) => {
  deactivateOthers(tenantId, input)
  const created = { ...input, id: String(nextId++) }
  tariffs[tenantId] = [...tariffs[tenantId], created]
  return created
})

export const updateTariff = vi.fn(async (tenantId: TenantId, id: string, input: TariffInput) => {
  deactivateOthers(tenantId, input)
  const updated = { ...input, id }
  tariffs[tenantId] = tariffs[tenantId].map((tariff) => tariff.id === id ? updated : tariff)
  return updated
})

export const deleteTariff = vi.fn(async (tenantId: TenantId, id: string) => {
  tariffs[tenantId] = tariffs[tenantId].filter((tariff) => tariff.id !== id)
})
