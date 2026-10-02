import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { resetFakeVehicles } from './fakeVehiclesApi'

// Os testes de interface não sobem o backend: a API de veículos é trocada por uma versão em memória.
vi.mock('../services/vehiclesApi', () => import('./fakeVehiclesApi'))

afterEach(() => {
  resetFakeVehicles()
  vi.clearAllMocks()
})
