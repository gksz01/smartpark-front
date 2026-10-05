import { vi } from 'vitest'
import { createFakeCrudApi } from './createFakeCrudApi'
import type { Payment, TenantId } from '../core/types'
import type { PaymentInput } from '../services/paymentsApi'

/*
 * Substitui src/services/paymentsApi.ts nos testes de interface (ver setup.ts).
 * Strategy, TarifaComConvenio, consumo do benefício e transação são testados no backend.
 */

const base = { reservationId: null, attendanceNumber: null, agreementName: null, createdAt: '2026-10-05T12:00:00.000Z' }

const INITIAL: Record<TenantId, Payment[]> = {
  shopping: [
    { ...base, id: '1', vehicleId: '2', vehicleLabel: 'Família · BRA2E19', duration: 4, tariffAmount: 48, amount: 48, chargedAmount: 50.4, method: 'Crédito', installments: 3, detail: 'Crédito em 3x de R$ 16,80', status: 'aprovado', receipt: 'CRE-AAA111' },
    { ...base, id: '2', vehicleId: '2', vehicleLabel: 'Família · BRA2E19', duration: 4, tariffAmount: 48, amount: 48, chargedAmount: 48, method: 'Débito', installments: 1, detail: 'Débito aprovado à vista', status: 'estornado', receipt: 'DEB-BBB222' },
  ],
  hospital: [
    { ...base, id: '3', vehicleId: '4', vehicleLabel: 'Meu carro · HSP2C34', duration: 3, tariffAmount: 30, amount: 30, chargedAmount: 30, method: 'Pix', installments: 1, detail: 'Pix aprovado instantaneamente', status: 'aprovado', receipt: 'PIX-CCC333' },
  ],
  condominium: [],
  company: [],
}

const PREFIXES = { 'Pix': 'PIX', 'Crédito': 'CRE', 'Débito': 'DEB' } as const

// Lista e exclusão vêm da fábrica; pagar e estornar têm regras próprias
const payments = createFakeCrudApi<Payment, PaymentInput>(INITIAL, { prepend: true })

export const resetFakePayments = payments.reset
export const listPayments = payments.list
export const deletePayment = payments.remove

export const createPayment = vi.fn(async (tenantId: TenantId, input: PaymentInput) => {
  const id = payments.newId()
  const amount = input.attendanceNumber ? 0 : input.duration * 12
  return payments.add(tenantId, {
    ...base, id, vehicleId: input.vehicleId, vehicleLabel: 'Meu carro', duration: input.duration, tariffAmount: input.duration * 12, amount, chargedAmount: amount,
    method: input.method, installments: input.installments, detail: `${input.method} aprovado`, status: 'aprovado', receipt: `${PREFIXES[input.method]}-NOVO${id}`,
    attendanceNumber: input.attendanceNumber ?? null, agreementName: input.attendanceNumber ? 'Saúde Plena' : null,
  })
})

export const refundPayment = vi.fn(async (tenantId: TenantId, id: string) => {
  return payments.replace(tenantId, { ...payments.find(tenantId, id), status: 'estornado' })
})
