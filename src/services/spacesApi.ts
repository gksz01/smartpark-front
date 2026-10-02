import type { ParkingSpace, TenantId } from '../core/types'
import { readResponse } from './api'

/** Dados enviados no formulário (id e requirement vêm da API). */
export type SpaceInput = Omit<ParkingSpace, 'id' | 'requirement'>

const jsonHeaders = { 'Content-Type': 'application/json' }

// READ — GET /api/spaces?tenant=...
export async function listSpaces(tenantId: TenantId): Promise<ParkingSpace[]> {
  const response = await fetch(`/api/spaces?tenant=${tenantId}`)
  return readResponse(response)
}

// CREATE — POST /api/spaces?tenant=...
export async function createSpace(tenantId: TenantId, space: SpaceInput): Promise<ParkingSpace> {
  const response = await fetch(`/api/spaces?tenant=${tenantId}`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(space) })
  return readResponse(response)
}

// UPDATE — PUT /api/spaces/:id?tenant=...
export async function updateSpace(tenantId: TenantId, id: string, space: SpaceInput): Promise<ParkingSpace> {
  const response = await fetch(`/api/spaces/${id}?tenant=${tenantId}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(space) })
  return readResponse(response)
}

// DELETE — DELETE /api/spaces/:id?tenant=...
export async function deleteSpace(tenantId: TenantId, id: string): Promise<void> {
  const response = await fetch(`/api/spaces/${id}?tenant=${tenantId}`, { method: 'DELETE' })
  return readResponse(response)
}
