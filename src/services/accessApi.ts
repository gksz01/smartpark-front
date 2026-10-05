import type { AccessRecord } from '../core/types'
import { createCrudApi } from './api'

/** Dados enviados no formulário (id, manual e horário são definidos pela API). */
export type AccessInput = Pick<AccessRecord, 'person' | 'identifier' | 'method' | 'direction' | 'status' | 'denialReason'>

// CRUD padrão em /api/access
const access = createCrudApi<AccessRecord, AccessInput>('access')
export const listAccess = access.list
export const createAccess = access.create
export const updateAccess = access.update
export const deleteAccess = access.remove
