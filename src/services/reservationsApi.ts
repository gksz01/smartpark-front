import type { Reservation, TenantId } from '../core/types'
import { readResponse } from './api'

/** Dados do formulário de nova reserva. */
export interface ReservationInput {
  vehicleId: string
  spaceId: string
  date: string
  time: string
  duration: number
}

/** Dados que podem ser alterados numa reserva ativa. */
export type ReservationChanges = Pick<ReservationInput, 'date' | 'time' | 'duration'>

/** Criar, alterar e cancelar devolvem a reserva e as notificações geradas pelo Observer. */
export interface ReservationResult {
  reservation: Reservation
  notifications: string[]
}

const jsonHeaders = { 'Content-Type': 'application/json' }

// READ — GET /api/reservations?tenant=...
export async function listReservations(tenantId: TenantId): Promise<Reservation[]> {
  const response = await fetch(`/api/reservations?tenant=${tenantId}`)
  return readResponse(response)
}

// CREATE — POST /api/reservations?tenant=...
export async function createReservation(tenantId: TenantId, input: ReservationInput): Promise<ReservationResult> {
  const response = await fetch(`/api/reservations?tenant=${tenantId}`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(input) })
  return readResponse(response)
}

// UPDATE — PUT /api/reservations/:id?tenant=...
export async function updateReservation(tenantId: TenantId, id: string, changes: ReservationChanges): Promise<ReservationResult> {
  const response = await fetch(`/api/reservations/${id}?tenant=${tenantId}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(changes) })
  return readResponse(response)
}

// UPDATE (status) — PUT /api/reservations/:id/cancel?tenant=...
export async function cancelReservation(tenantId: TenantId, id: string): Promise<ReservationResult> {
  const response = await fetch(`/api/reservations/${id}/cancel?tenant=${tenantId}`, { method: 'PUT' })
  return readResponse(response)
}

// DELETE — DELETE /api/reservations/:id?tenant=...
export async function deleteReservation(tenantId: TenantId, id: string): Promise<void> {
  const response = await fetch(`/api/reservations/${id}?tenant=${tenantId}`, { method: 'DELETE' })
  return readResponse(response)
}
