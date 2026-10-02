import { vi } from 'vitest'
import type { ParkingSpace, TenantId } from '../core/types'
import type { SpaceInput } from '../services/spacesApi'

/*
 * Substitui src/services/spacesApi.ts nos testes de interface (ver setup.ts),
 * guardando as vagas em memória por tenant. O backend real é testado em server/.
 */

const INITIAL: Record<TenantId, ParkingSpace[]> = {
  shopping: [
    { id: '1', code: 'A-01', sector: 'A', type: 'Comum', status: 'Livre', requirement: 'Livre para qualquer veículo' },
    { id: '2', code: 'A-02', sector: 'A', type: 'PCD', status: 'Ocupada', requirement: 'Exige credencial PCD visível no veículo' },
    { id: '3', code: 'B-13', sector: 'B', type: 'Elétrico', status: 'Livre', requirement: 'Exclusiva para veículos elétricos em recarga' },
  ],
  condominium: [{ id: '4', code: 'T1-101', sector: 'Torre 1', type: 'Nominal', status: 'Ocupada', requirement: 'Exclusiva do morador da unidade vinculada' }],
  hospital: [{ id: '5', code: 'P-01', sector: 'Pronto-socorro', type: 'Prioritária', status: 'Livre', requirement: 'Exclusiva para pacientes e acompanhantes' }],
  company: [{ id: '6', code: 'D-01', sector: 'Diretoria', type: 'Restrito', status: 'Ocupada', requirement: 'Exclusiva para credenciais autorizadas' }],
}

let spaces = structuredClone(INITIAL)
let nextId = 100

export function resetFakeSpaces() {
  spaces = structuredClone(INITIAL)
  nextId = 100
}

export const listSpaces = vi.fn(async (tenantId: TenantId) => spaces[tenantId])

export const createSpace = vi.fn(async (tenantId: TenantId, input: SpaceInput) => {
  const created = { ...input, id: String(nextId++), requirement: `Requisito da vaga ${input.type}` }
  spaces[tenantId] = [...spaces[tenantId], created]
  return created
})

export const updateSpace = vi.fn(async (tenantId: TenantId, id: string, input: SpaceInput) => {
  const updated = { ...input, id, requirement: `Requisito da vaga ${input.type}` }
  spaces[tenantId] = spaces[tenantId].map((space) => space.id === id ? updated : space)
  return updated
})

export const deleteSpace = vi.fn(async (tenantId: TenantId, id: string) => {
  spaces[tenantId] = spaces[tenantId].filter((space) => space.id !== id)
})
