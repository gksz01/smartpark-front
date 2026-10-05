import type { User } from '../core/types'
import { createCrudApi } from './api'

/** Dados enviados no formulário (o id é gerado pelo banco). */
export type UserInput = Omit<User, 'id'>

// CRUD padrão em /api/users
const users = createCrudApi<User, UserInput>('users')
export const listUsers = users.list
export const createUser = users.create
export const updateUser = users.update
export const deleteUser = users.remove
