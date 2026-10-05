import type { DemoState, Parking } from '../core/types'

export const PARKINGS: Parking[] = [
  { id: 'central', name: 'Estacionamento Central', address: 'Av. das Palmeiras, 450', distance: '350 m', available: 84, total: 240, pricePerHour: 12, open24h: true, restricted: false, sector: 'Setor A', services: ['Coberto', 'Recarga elétrica', 'Acessível'] },
  { id: 'norte', name: 'Garagem Norte', address: 'Rua das Acácias, 120', distance: '1,2 km', available: 32, total: 110, pricePerHour: 9, open24h: false, restricted: false, sector: 'Setor Norte', services: ['Coberto', 'Bicicletário'] },
  { id: 'premium', name: 'Edifício Garagem Premium', address: 'Al. Rio Claro, 88', distance: '2,4 km', available: 19, total: 96, pricePerHour: 16, open24h: true, restricted: true, sector: 'Setor VIP', services: ['Coberto', 'Manobrista', 'Lavagem'] },
]

export const INITIAL_STATE: DemoState = {
  tenantId: 'shopping',
  role: 'driver',
  academicMode: true,
  vehicles: [], // carregados do banco pela API (ver server/seed/seed.ts)
  payments: [],
}
