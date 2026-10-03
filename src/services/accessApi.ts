import type { AccessRecord, TenantId } from '../core/types'
import { readResponse } from './api'

/** Dados enviados no formulário (id, manual e horário são definidos pela API). */
export type AccessInput = Pick<AccessRecord, 'person' | 'identifier' | 'method' | 'direction' | 'status' | 'denialReason'>

const jsonHeaders = { 'Content-Type': 'application/json' }

// READ — GET /api/access?tenant=...
export async function listAccess(tenantId: TenantId): Promise<AccessRecord[]> {
  const response = await fetch(`/api/access?tenant=${tenantId}`)
  return readResponse(response)
}

// CREATE — POST /api/access?tenant=...
export async function createAccess(tenantId: TenantId, access: AccessInput): Promise<AccessRecord> {
  const response = await fetch(`/api/access?tenant=${tenantId}`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(access) })
  return readResponse(response)
}

// UPDATE — PUT /api/access/:id?tenant=...
export async function updateAccess(tenantId: TenantId, id: string, access: AccessInput): Promise<AccessRecord> {
  const response = await fetch(`/api/access/${id}?tenant=${tenantId}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(access) })
  return readResponse(response)
}

// DELETE — DELETE /api/access/:id?tenant=...
export async function deleteAccess(tenantId: TenantId, id: string): Promise<void> {
  const response = await fetch(`/api/access/${id}?tenant=${tenantId}`, { method: 'DELETE' })
  return readResponse(response)
}
