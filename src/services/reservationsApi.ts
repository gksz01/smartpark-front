import type { Reservation, TenantId } from '../core/types'
import { request } from './api'

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

// Reservas têm respostas próprias (com notificações) e a ação Cancelar, então as chamadas ficam explícitas.
export const listReservations = (tenantId: TenantId) => request<Reservation[]>(tenantId, 'reservations')
export const createReservation = (tenantId: TenantId, input: ReservationInput) => request<ReservationResult>(tenantId, 'reservations', 'POST', input)
export const updateReservation = (tenantId: TenantId, id: string, changes: ReservationChanges) => request<ReservationResult>(tenantId, `reservations/${id}`, 'PUT', changes)
export const cancelReservation = (tenantId: TenantId, id: string) => request<ReservationResult>(tenantId, `reservations/${id}/cancel`, 'PUT')
export const deleteReservation = (tenantId: TenantId, id: string) => request<void>(tenantId, `reservations/${id}`, 'DELETE')
