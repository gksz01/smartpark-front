import type { Tariff, TenantId } from '../core/types'
import { readResponse } from './api'

/** Dados enviados no formulário (o id é gerado pelo banco). */
export type TariffInput = Omit<Tariff, 'id'>

const jsonHeaders = { 'Content-Type': 'application/json' }

// READ — GET /api/tariffs?tenant=...
export async function listTariffs(tenantId: TenantId): Promise<Tariff[]> {
  const response = await fetch(`/api/tariffs?tenant=${tenantId}`)
  return readResponse(response)
}

// CREATE — POST /api/tariffs?tenant=...
export async function createTariff(tenantId: TenantId, tariff: TariffInput): Promise<Tariff> {
  const response = await fetch(`/api/tariffs?tenant=${tenantId}`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(tariff) })
  return readResponse(response)
}

// UPDATE — PUT /api/tariffs/:id?tenant=...
export async function updateTariff(tenantId: TenantId, id: string, tariff: TariffInput): Promise<Tariff> {
  const response = await fetch(`/api/tariffs/${id}?tenant=${tenantId}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(tariff) })
  return readResponse(response)
}

// DELETE — DELETE /api/tariffs/:id?tenant=...
export async function deleteTariff(tenantId: TenantId, id: string): Promise<void> {
  const response = await fetch(`/api/tariffs/${id}?tenant=${tenantId}`, { method: 'DELETE' })
  return readResponse(response)
}
