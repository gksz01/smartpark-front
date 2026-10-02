import { vi } from 'vitest'
import type { TenantId, User } from '../core/types'
import type { UserInput } from '../services/usersApi'

/*
 * Substitui src/services/usersApi.ts nos testes de interface (ver setup.ts),
 * guardando as pessoas em memória por tenant. O backend real é testado em server/.
 */

const INITIAL: Record<TenantId, User[]> = {
  shopping: [{ id: '1', name: 'Marina Costa', document: '123.456.789-01', type: 'motorista', role: 'driver', active: true }],
  condominium: [
    { id: '2', name: 'Juliana Reis', document: '456.789.012-34', type: 'morador', role: 'resident', active: true },
    { id: '3', name: 'Carlos Nunes', document: '567.890.123-45', type: 'visitante', role: 'visitor', active: true },
  ],
  hospital: [
    { id: '4', name: 'Helena Moreira', document: '678.901.234-56', type: 'paciente', role: 'driver', active: true },
    { id: '5', name: 'Beatriz Souza', document: '789.012.345-67', type: 'acompanhante', role: 'visitor', active: false },
  ],
  company: [{ id: '6', name: 'Lucas Martins', document: '890.123.456-78', type: 'funcionario', role: 'employee', active: true }],
}

let users = structuredClone(INITIAL)
let nextId = 100

export function resetFakeUsers() {
  users = structuredClone(INITIAL)
  nextId = 100
}

export const listUsers = vi.fn(async (tenantId: TenantId) => users[tenantId])

export const createUser = vi.fn(async (tenantId: TenantId, input: UserInput) => {
  const created = { ...input, id: String(nextId++) }
  users[tenantId] = [...users[tenantId], created]
  return created
})

export const updateUser = vi.fn(async (tenantId: TenantId, id: string, input: UserInput) => {
  const updated = { ...input, id }
  users[tenantId] = users[tenantId].map((user) => user.id === id ? updated : user)
  return updated
})

export const deleteUser = vi.fn(async (tenantId: TenantId, id: string) => {
  users[tenantId] = users[tenantId].filter((user) => user.id !== id)
})
