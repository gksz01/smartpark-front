import type { TenantId, User } from '../core/types'
import { readResponse } from './api'

/** Dados enviados no formulário (o id é gerado pelo banco). */
export type UserInput = Omit<User, 'id'>

const jsonHeaders = { 'Content-Type': 'application/json' }

// READ — GET /api/users?tenant=...
export async function listUsers(tenantId: TenantId): Promise<User[]> {
  const response = await fetch(`/api/users?tenant=${tenantId}`)
  return readResponse(response)
}

// CREATE — POST /api/users?tenant=...
export async function createUser(tenantId: TenantId, user: UserInput): Promise<User> {
  const response = await fetch(`/api/users?tenant=${tenantId}`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(user) })
  return readResponse(response)
}

// UPDATE — PUT /api/users/:id?tenant=...
export async function updateUser(tenantId: TenantId, id: string, user: UserInput): Promise<User> {
  const response = await fetch(`/api/users/${id}?tenant=${tenantId}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(user) })
  return readResponse(response)
}

// DELETE — DELETE /api/users/:id?tenant=...
export async function deleteUser(tenantId: TenantId, id: string): Promise<void> {
  const response = await fetch(`/api/users/${id}?tenant=${tenantId}`, { method: 'DELETE' })
  return readResponse(response)
}
