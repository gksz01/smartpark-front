import type { Vehicle } from '../core/types'
import { createCrudApi } from './api'

/** Dados enviados no formulário (o id é gerado pelo banco). */
export type VehicleInput = Omit<Vehicle, 'id'>

// CRUD padrão em /api/vehicles
const vehicles = createCrudApi<Vehicle, VehicleInput>('vehicles')
export const listVehicles = vehicles.list
export const createVehicle = vehicles.create
export const updateVehicle = vehicles.update
export const deleteVehicle = vehicles.remove
