import type { Agreement, AttendanceCheck, TenantId } from '../core/types'
import { readResponse } from './api'

/** Dados enviados no formulário (id e attendanceCount vêm da API). */
export type AgreementInput = Omit<Agreement, 'id' | 'attendanceCount'>

const jsonHeaders = { 'Content-Type': 'application/json' }

// READ — GET /api/agreements?tenant=...
export async function listAgreements(tenantId: TenantId): Promise<Agreement[]> {
  const response = await fetch(`/api/agreements?tenant=${tenantId}`)
  return readResponse(response)
}

// CREATE — POST /api/agreements?tenant=...
export async function createAgreement(tenantId: TenantId, agreement: AgreementInput): Promise<Agreement> {
  const response = await fetch(`/api/agreements?tenant=${tenantId}`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(agreement) })
  return readResponse(response)
}

// UPDATE — PUT /api/agreements/:id?tenant=...
export async function updateAgreement(tenantId: TenantId, id: string, agreement: AgreementInput): Promise<Agreement> {
  const response = await fetch(`/api/agreements/${id}?tenant=${tenantId}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(agreement) })
  return readResponse(response)
}

// DELETE — DELETE /api/agreements/:id?tenant=...
export async function deleteAgreement(tenantId: TenantId, id: string): Promise<void> {
  const response = await fetch(`/api/agreements/${id}?tenant=${tenantId}`, { method: 'DELETE' })
  return readResponse(response)
}

// Validação de atendimento — POST /api/agreements/validate?tenant=... (não consome o benefício)
export async function validateAttendance(tenantId: TenantId, number: string): Promise<AttendanceCheck> {
  const response = await fetch(`/api/agreements/validate?tenant=${tenantId}`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ number }) })
  return readResponse(response)
}
