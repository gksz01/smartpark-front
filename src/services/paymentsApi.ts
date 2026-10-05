import type { Payment, PaymentMethod, TenantId } from '../core/types'
import { readResponse } from './api'

/** Dados do formulário. Valores NÃO são enviados: a API calcula tudo. */
export interface PaymentInput {
  vehicleId: string
  duration: number
  method: PaymentMethod
  installments: number
  /** Opcional; só existe no formulário quando medicalAgreement está ligado. */
  attendanceNumber?: string
}

const jsonHeaders = { 'Content-Type': 'application/json' }

// READ — GET /api/payments?tenant=...
export async function listPayments(tenantId: TenantId): Promise<Payment[]> {
  const response = await fetch(`/api/payments?tenant=${tenantId}`)
  return readResponse(response)
}

// CREATE — POST /api/payments?tenant=...
export async function createPayment(tenantId: TenantId, input: PaymentInput): Promise<Payment> {
  const response = await fetch(`/api/payments?tenant=${tenantId}`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(input) })
  return readResponse(response)
}

// UPDATE (estorno) — PUT /api/payments/:id/refund?tenant=...
export async function refundPayment(tenantId: TenantId, id: string): Promise<Payment> {
  const response = await fetch(`/api/payments/${id}/refund?tenant=${tenantId}`, { method: 'PUT' })
  return readResponse(response)
}

// DELETE — DELETE /api/payments/:id?tenant=...
export async function deletePayment(tenantId: TenantId, id: string): Promise<void> {
  const response = await fetch(`/api/payments/${id}?tenant=${tenantId}`, { method: 'DELETE' })
  return readResponse(response)
}
