import { createFakeCrudApi } from './createFakeCrudApi'
import type { TenantId, Vehicle } from '../core/types'
import type { VehicleInput } from '../services/vehiclesApi'

/*
 * Substitui src/services/vehiclesApi.ts nos testes de interface (ver setup.ts),
 * guardando os veículos em memória por tenant. O backend real é testado em server/.
 */

const INITIAL: Record<TenantId, Vehicle[]> = {
  shopping: [{ id: '1', nickname: 'Meu carro', plate: 'SPK1A23', model: 'Honda City', color: 'Cinza', unit: '', rfidTag: '' }],
  condominium: [{ id: '2', nickname: 'Meu carro', plate: 'SPK1A23', model: 'Honda City', color: 'Cinza', unit: 'Torre B · 804', rfidTag: '' }],
  hospital: [{ id: '4', nickname: 'Meu carro', plate: 'HSP2C34', model: 'Toyota Corolla', color: 'Preto', unit: '', rfidTag: '' }],
  company: [{ id: '3', nickname: 'Carro da equipe', plate: 'NXR5D67', model: 'Chevrolet Onix', color: 'Branco', unit: '', rfidTag: 'NX-71520' }],
}

const vehicles = createFakeCrudApi<Vehicle, VehicleInput>(INITIAL)

export const resetFakeVehicles = vehicles.reset
export const listVehicles = vehicles.list
export const createVehicle = vehicles.create
export const updateVehicle = vehicles.update
export const deleteVehicle = vehicles.remove
