import type { ParkingSpace, TenantId } from '../core/types'
import { createCrudApi, request } from './api'

/** Dados enviados no formulário (id e requirement vêm da API). */
export type SpaceInput = Omit<ParkingSpace, 'id' | 'requirement'>

/** Resultado da simulação do sensor: a vaga atualizada e as notificações do Observer. */
export interface SensorResult {
  space: ParkingSpace
  notifications: string[]
}

// CRUD padrão em /api/spaces
const spaces = createCrudApi<ParkingSpace, SpaceInput>('spaces')
export const listSpaces = spaces.list
export const createSpace = spaces.create
export const updateSpace = spaces.update
export const deleteSpace = spaces.remove

// OBSERVER — POST /api/spaces/:id/sensor (leitura simulada do sensor da vaga)
export function simulateSensor(tenantId: TenantId, id: string, reading: 'ocupada' | 'liberada'): Promise<SensorResult> {
  return request(tenantId, `spaces/${id}/sensor`, 'POST', { reading })
}
