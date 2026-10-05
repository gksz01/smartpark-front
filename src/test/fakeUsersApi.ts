import { createFakeCrudApi } from './createFakeCrudApi'
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

const users = createFakeCrudApi<User, UserInput>(INITIAL)

export const resetFakeUsers = users.reset
export const listUsers = users.list
export const createUser = users.create
export const updateUser = users.update
export const deleteUser = users.remove
