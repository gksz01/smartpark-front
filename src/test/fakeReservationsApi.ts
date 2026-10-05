import { vi } from 'vitest'
import { createFakeCrudApi } from './createFakeCrudApi'
import type { Reservation, TenantId } from '../core/types'
import type { ReservationChanges, ReservationInput } from '../services/reservationsApi'
import { listSpaces } from './fakeSpacesApi'

/*
 * Substitui src/services/reservationsApi.ts nos testes de interface (ver setup.ts).
 * Guarda as reservas em memória; Strategy, Observer e vagas são testados no backend.
 */

const INITIAL: Record<TenantId, Reservation[]> = {
  shopping: [
    { id: '1', vehicleId: '2', vehicleLabel: 'Família · BRA2E19', spaceId: '9', spaceCode: 'A-03', date: '2026-10-07', time: '18:30', duration: 2, estimate: 24, status: 'confirmada' },
    { id: '2', vehicleId: '2', vehicleLabel: 'Família · BRA2E19', spaceId: '10', spaceCode: 'B-11', date: '2026-10-06', time: '10:00', duration: 4, estimate: 48, status: 'cancelada' },
  ],
  condominium: [],
  hospital: [],
  company: [],
}

// Lista e exclusão vêm da fábrica; criar, alterar e cancelar devolvem notificações (como o Observer real)
const reservations = createFakeCrudApi<Reservation, ReservationInput>(INITIAL, { prepend: true })

export const resetFakeReservations = reservations.reset
export const listReservations = reservations.list
export const deleteReservation = reservations.remove

export const createReservation = vi.fn(async (tenantId: TenantId, input: ReservationInput) => {
  const space = (await listSpaces(tenantId)).find((item) => item.id === input.spaceId)
  const created = reservations.add(tenantId, {
    id: reservations.newId(), vehicleId: input.vehicleId, vehicleLabel: 'Meu carro · SPK1A23', spaceId: input.spaceId, spaceCode: space?.code ?? '?',
    date: input.date, time: input.time, duration: input.duration, estimate: input.duration * 12, status: 'confirmada',
  })
  return { reservation: created, notifications: [`Reserva confirmada para a vaga ${created.spaceCode}.`] }
})

export const updateReservation = vi.fn(async (tenantId: TenantId, id: string, changes: ReservationChanges) => {
  const updated = reservations.replace(tenantId, { ...reservations.find(tenantId, id), ...changes, estimate: changes.duration * 12 })
  return { reservation: updated, notifications: [`Nova data: ${changes.date} às ${changes.time}, por ${changes.duration}h.`] }
})

export const cancelReservation = vi.fn(async (tenantId: TenantId, id: string) => {
  const updated = reservations.replace(tenantId, { ...reservations.find(tenantId, id), status: 'cancelada' })
  return { reservation: updated, notifications: [`Reserva cancelada. A vaga ${updated.spaceCode} foi liberada.`] }
})
