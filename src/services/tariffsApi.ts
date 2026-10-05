import type { Tariff } from '../core/types'
import { createCrudApi } from './api'

/** Dados enviados no formulário (o id é gerado pelo banco). */
export type TariffInput = Omit<Tariff, 'id'>

// CRUD padrão em /api/tariffs
const tariffs = createCrudApi<Tariff, TariffInput>('tariffs')
export const listTariffs = tariffs.list
export const createTariff = tariffs.create
export const updateTariff = tariffs.update
export const deleteTariff = tariffs.remove
