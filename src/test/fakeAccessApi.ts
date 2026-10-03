import { vi } from 'vitest'
import type { AccessRecord, TenantId } from '../core/types'
import type { AccessInput } from '../services/accessApi'

/*
 * Substitui src/services/accessApi.ts nos testes de interface (ver setup.ts),
 * guardando os acessos em memória por tenant. O backend real é testado em server/.
 */

const INITIAL: Record<TenantId, AccessRecord[]> = {
  shopping: [
    { id: '1', person: 'Marina Costa', identifier: 'BRA2E19', method: 'LPR', direction: 'Entrada', status: 'Liberado', manual: false, denialReason: '', time: '14:32' },
    { id: '2', person: 'Bruno Dias', identifier: 'DFK4J86', method: 'LPR', direction: 'Entrada', status: 'Pendente', manual: false, denialReason: '', time: '13:54' },
    { id: '3', person: 'Carlos Nunes', identifier: 'SPK1A23', method: 'LPR', direction: 'Entrada', status: 'Negado', manual: false, denialReason: 'Placa sem cadastro', time: '13:41' },
  ],
  condominium: [{ id: '4', person: 'Juliana Reis', identifier: 'QR-4839-221', method: 'QR_CODE', direction: 'Entrada', status: 'Liberado', manual: false, denialReason: '', time: '14:05' }],
  hospital: [{ id: '5', person: 'Helena Moreira', identifier: 'HSP2C34', method: 'LPR', direction: 'Entrada', status: 'Liberado', manual: false, denialReason: '', time: '14:40' }],
  company: [{ id: '6', person: 'Lucas Martins', identifier: 'RF-10982', method: 'RFID', direction: 'Entrada', status: 'Liberado', manual: false, denialReason: '', time: '08:55' }],
}

let accesses = structuredClone(INITIAL)
let nextId = 100

export function resetFakeAccess() {
  accesses = structuredClone(INITIAL)
  nextId = 100
}

export const listAccess = vi.fn(async (tenantId: TenantId) => accesses[tenantId])

export const createAccess = vi.fn(async (tenantId: TenantId, input: AccessInput) => {
  const created = { ...input, id: String(nextId++), manual: true, time: '15:00' }
  accesses[tenantId] = [created, ...accesses[tenantId]]
  return created
})

export const updateAccess = vi.fn(async (tenantId: TenantId, id: string, input: AccessInput) => {
  const previous = accesses[tenantId].find((access) => access.id === id)!
  const updated = { ...previous, ...input }
  accesses[tenantId] = accesses[tenantId].map((access) => access.id === id ? updated : access)
  return updated
})

export const deleteAccess = vi.fn(async (tenantId: TenantId, id: string) => {
  accesses[tenantId] = accesses[tenantId].filter((access) => access.id !== id)
})
