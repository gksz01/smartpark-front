import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { resetFakeAccess } from './fakeAccessApi'
import { resetFakeAgreements } from './fakeAgreementsApi'
import { resetFakePayments } from './fakePaymentsApi'
import { resetFakeReservations } from './fakeReservationsApi'
import { resetFakeSpaces } from './fakeSpacesApi'
import { resetFakeTariffs } from './fakeTariffsApi'
import { resetFakeUsers } from './fakeUsersApi'
import { resetFakeVehicles } from './fakeVehiclesApi'

// Os testes de interface não sobem o backend: as APIs são trocadas por versões em memória.
vi.mock('../services/vehiclesApi', () => import('./fakeVehiclesApi'))
vi.mock('../services/usersApi', () => import('./fakeUsersApi'))
vi.mock('../services/spacesApi', () => import('./fakeSpacesApi'))
vi.mock('../services/accessApi', () => import('./fakeAccessApi'))
vi.mock('../services/tariffsApi', () => import('./fakeTariffsApi'))
vi.mock('../services/reservationsApi', () => import('./fakeReservationsApi'))
vi.mock('../services/agreementsApi', () => import('./fakeAgreementsApi'))
vi.mock('../services/paymentsApi', () => import('./fakePaymentsApi'))

afterEach(() => {
  resetFakeVehicles()
  resetFakeUsers()
  resetFakeSpaces()
  resetFakeAccess()
  resetFakeTariffs()
  resetFakeReservations()
  resetFakeAgreements()
  resetFakePayments()
  vi.clearAllMocks()
})
