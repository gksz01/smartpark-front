import type { TenantId, Vehicle } from '../core/types'
import { readResponse } from './api'

/** Dados enviados no formulário (o id é gerado pelo banco). */
export type VehicleInput = Omit<Vehicle, 'id'>

const jsonHeaders = { 'Content-Type': 'application/json' }

// READ — GET /api/vehicles?tenant=...
export async function listVehicles(tenantId: TenantId): Promise<Vehicle[]> {
  const response = await fetch(`/api/vehicles?tenant=${tenantId}`)
  return readResponse(response)
}

// CREATE — POST /api/vehicles?tenant=...
export async function createVehicle(tenantId: TenantId, vehicle: VehicleInput): Promise<Vehicle> {
  const response = await fetch(`/api/vehicles?tenant=${tenantId}`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(vehicle) })
  return readResponse(response)
}

// UPDATE — PUT /api/vehicles/:id?tenant=...
export async function updateVehicle(tenantId: TenantId, id: string, vehicle: VehicleInput): Promise<Vehicle> {
  const response = await fetch(`/api/vehicles/${id}?tenant=${tenantId}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(vehicle) })
  return readResponse(response)
}

// DELETE — DELETE /api/vehicles/:id?tenant=...
export async function deleteVehicle(tenantId: TenantId, id: string): Promise<void> {
  const response = await fetch(`/api/vehicles/${id}?tenant=${tenantId}`, { method: 'DELETE' })
  return readResponse(response)
}
