import { vi } from 'vitest'
import type { TenantId, Vehicle } from '../core/types'
import type { VehicleInput } from '../services/vehiclesApi'

/*
 * Substitui src/services/vehiclesApi.ts nos testes de interface (ver setup.ts),
 * guardando os veículos em memória por tenant. O backend real é testado em server/.
 */

const INITIAL: Record<TenantId, Vehicle[]> = {
  shopping: [{ id: '1', nickname: 'Meu carro', plate: 'SPK1A23', model: 'Honda City', color: 'Cinza', unit: '', rfidTag: '' }],
  condominium: [{ id: '2', nickname: 'Meu carro', plate: 'SPK1A23', model: 'Honda City', color: 'Cinza', unit: 'Torre B · 804', rfidTag: '' }],
  hospital: [],
  company: [{ id: '3', nickname: 'Carro da equipe', plate: 'NXR5D67', model: 'Chevrolet Onix', color: 'Branco', unit: '', rfidTag: 'NX-71520' }],
}

let vehicles = structuredClone(INITIAL)
let nextId = 100

export function resetFakeVehicles() {
  vehicles = structuredClone(INITIAL)
  nextId = 100
}

export const listVehicles = vi.fn(async (tenantId: TenantId) => vehicles[tenantId])

export const createVehicle = vi.fn(async (tenantId: TenantId, input: VehicleInput) => {
  const created = { ...input, id: String(nextId++) }
  vehicles[tenantId] = [...vehicles[tenantId], created]
  return created
})

export const updateVehicle = vi.fn(async (tenantId: TenantId, id: string, input: VehicleInput) => {
  const updated = { ...input, id }
  vehicles[tenantId] = vehicles[tenantId].map((vehicle) => vehicle.id === id ? updated : vehicle)
  return updated
})

export const deleteVehicle = vi.fn(async (tenantId: TenantId, id: string) => {
  vehicles[tenantId] = vehicles[tenantId].filter((vehicle) => vehicle.id !== id)
})
