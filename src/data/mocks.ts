import type { AccessRecord, DemoState, Parking, ParkingSpace } from '../core/types'

export const PARKINGS: Parking[] = [
  { id: 'central', name: 'Estacionamento Central', address: 'Av. das Palmeiras, 450', distance: '350 m', available: 84, total: 240, pricePerHour: 12, open24h: true, restricted: false, sector: 'Setor A', services: ['Coberto', 'Recarga elétrica', 'Acessível'] },
  { id: 'norte', name: 'Garagem Norte', address: 'Rua das Acácias, 120', distance: '1,2 km', available: 32, total: 110, pricePerHour: 9, open24h: false, restricted: false, sector: 'Setor Norte', services: ['Coberto', 'Bicicletário'] },
  { id: 'premium', name: 'Edifício Garagem Premium', address: 'Al. Rio Claro, 88', distance: '2,4 km', available: 19, total: 96, pricePerHour: 16, open24h: true, restricted: true, sector: 'Setor VIP', services: ['Coberto', 'Manobrista', 'Lavagem'] },
]

export const SPACES: ParkingSpace[] = [
  { id: 'A-01', sector: 'A', type: 'Comum', status: 'Livre' },
  { id: 'A-02', sector: 'A', type: 'PCD', status: 'Ocupada' },
  { id: 'A-03', sector: 'A', type: 'Elétrico', status: 'Reservada' },
  { id: 'A-04', sector: 'A', type: 'Comum', status: 'Bloqueada' },
  { id: 'B-11', sector: 'B', type: 'Comum', status: 'Livre' },
  { id: 'B-12', sector: 'B', type: 'Nominal', status: 'Ocupada' },
  { id: 'B-13', sector: 'B', type: 'Restrito', status: 'Livre' },
  { id: 'B-14', sector: 'B', type: 'Comum', status: 'Ocupada' },
  { id: 'C-21', sector: 'C', type: 'Elétrico', status: 'Livre' },
  { id: 'C-22', sector: 'C', type: 'Comum', status: 'Reservada' },
  { id: 'C-23', sector: 'C', type: 'PCD', status: 'Livre' },
  { id: 'C-24', sector: 'C', type: 'Restrito', status: 'Bloqueada' },
]

export const ACCESS_RECORDS: AccessRecord[] = [
  { id: 'ac-1', person: 'Marina Costa', plate: 'BRA2E19', qrCode: 'QR-4839-221', rfid: 'RF-10982', time: '14:32', direction: 'Entrada', status: 'Liberado' },
  { id: 'ac-2', person: 'Rafael Lima', plate: 'GHT7A42', qrCode: 'QR-9912-118', rfid: 'RF-28473', time: '14:18', direction: 'Saída', status: 'Liberado' },
  { id: 'ac-3', person: 'Juliana Reis', plate: 'DFK4J86', qrCode: 'QR-1157-620', rfid: 'RF-67011', time: '13:54', direction: 'Entrada', status: 'Pendente' },
  { id: 'ac-4', person: 'Carlos Nunes', plate: 'SPK1A23', qrCode: 'QR-7643-052', rfid: 'RF-44310', time: '13:41', direction: 'Entrada', status: 'Negado' },
]

export const INITIAL_STATE: DemoState = {
  tenantId: 'shopping',
  role: 'driver',
  academicMode: true,
  vehicles: [], // carregados do banco pela API (ver server/seed/seed.ts)
  reservations: [
    { id: 'res-1', parkingId: 'central', date: '2026-09-05', time: '18:30', duration: 2, vehicleId: 'v-1', estimate: 24, status: 'confirmed' },
  ],
  payments: [],
  manualAccesses: [],
  medicalValidations: [],
}
