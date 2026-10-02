import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { resetFakeUsers } from './fakeUsersApi'
import { resetFakeVehicles } from './fakeVehiclesApi'

// Os testes de interface não sobem o backend: as APIs são trocadas por versões em memória.
vi.mock('../services/vehiclesApi', () => import('./fakeVehiclesApi'))
vi.mock('../services/usersApi', () => import('./fakeUsersApi'))

afterEach(() => {
  resetFakeVehicles()
  resetFakeUsers()
  vi.clearAllMocks()
})
