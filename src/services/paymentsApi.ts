import type { Payment, PaymentMethod, TenantId } from '../core/types'
import { request } from './api'

/** Dados do formulário. Valores NÃO são enviados: a API calcula tudo. */
export interface PaymentInput {
  vehicleId: string
  duration: number
  method: PaymentMethod
  installments: number
  /** Opcional; só existe no formulário quando medicalAgreement está ligado. */
  attendanceNumber?: string
}

// Pagamentos não têm edição: o Update é o estorno, então as chamadas ficam explícitas.
export const listPayments = (tenantId: TenantId) => request<Payment[]>(tenantId, 'payments')
export const createPayment = (tenantId: TenantId, input: PaymentInput) => request<Payment>(tenantId, 'payments', 'POST', input)
export const refundPayment = (tenantId: TenantId, id: string) => request<Payment>(tenantId, `payments/${id}/refund`, 'PUT')
export const deletePayment = (tenantId: TenantId, id: string) => request<void>(tenantId, `payments/${id}`, 'DELETE')
