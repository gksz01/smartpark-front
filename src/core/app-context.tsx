import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { INITIAL_STATE } from '../data/mocks'
import { resetDatabase } from '../services/api'
import { createVehicle, deleteVehicle, listVehicles, updateVehicle, type VehicleInput } from '../services/vehiclesApi'
import { isRole, isTenantId, TENANTS } from './config'
import type { AccessRecord, DemoState, MedicalValidation, Payment, Reservation, Role, TenantId, Vehicle } from './types'

const STORAGE_KEY = 'smartpark:parte3:v1'

type Action =
  | { type: 'SELECT_CONTEXT'; tenantId: TenantId; role: Role }
  | { type: 'SET_ACADEMIC'; enabled: boolean }
  | { type: 'SET_VEHICLES'; vehicles: Vehicle[] }
  | { type: 'SAVE_VEHICLE'; vehicle: Vehicle }
  | { type: 'DELETE_VEHICLE'; id: string }
  | { type: 'ADD_RESERVATION'; reservation: Reservation }
  | { type: 'ADD_PAYMENT'; payment: Payment }
  | { type: 'ADD_ACCESS'; access: AccessRecord }
  | { type: 'ADD_MEDICAL'; validation: MedicalValidation }
  | { type: 'RESET' }

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'SELECT_CONTEXT': return { ...state, tenantId: action.tenantId, role: action.role }
    case 'SET_ACADEMIC': return { ...state, academicMode: action.enabled }
    case 'SET_VEHICLES': return { ...state, vehicles: action.vehicles }
    case 'SAVE_VEHICLE': {
      const exists = state.vehicles.some((vehicle) => vehicle.id === action.vehicle.id)
      // Novos veículos vão para o fim, na mesma ordem em que a API devolve (ORDER BY id)
      return { ...state, vehicles: exists ? state.vehicles.map((vehicle) => vehicle.id === action.vehicle.id ? action.vehicle : vehicle) : [...state.vehicles, action.vehicle] }
    }
    case 'DELETE_VEHICLE': return { ...state, vehicles: state.vehicles.filter((vehicle) => vehicle.id !== action.id) }
    case 'ADD_RESERVATION': return { ...state, reservations: [action.reservation, ...state.reservations] }
    case 'ADD_PAYMENT': return { ...state, payments: [action.payment, ...state.payments] }
    case 'ADD_ACCESS': return { ...state, manualAccesses: [action.access, ...state.manualAccesses] }
    case 'ADD_MEDICAL': return { ...state, medicalValidations: [action.validation, ...state.medicalValidations] }
    case 'RESET': return structuredClone(INITIAL_STATE)
  }
}

function readInitialState() {
  let state = structuredClone(INITIAL_STATE)
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) state = { ...state, ...JSON.parse(saved) }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }

  // Veículos vêm do banco (API), nunca do localStorage
  state.vehicles = []

  if (!isTenantId(state.tenantId)) state.tenantId = INITIAL_STATE.tenantId
  if (!isRole(state.role)) state.role = INITIAL_STATE.role

  const params = new URLSearchParams(window.location.search)
  const tenantParam = params.get('tenant')
  const roleParam = params.get('role')
  const academicParam = params.get('academic')
  let configurationError = ''

  if (tenantParam) {
    if (isTenantId(tenantParam)) state.tenantId = tenantParam
    else configurationError = `O cliente “${tenantParam}” não existe nesta configuração.`
  }
  if (roleParam) {
    if (isRole(roleParam)) state.role = roleParam
    else configurationError = `O perfil “${roleParam}” não existe nesta configuração.`
  }
  if (academicParam === '0' || academicParam === '1') state.academicMode = academicParam === '1'

  if (!TENANTS[state.tenantId].allowedRoles.includes(state.role)) {
    if (roleParam || tenantParam) configurationError = `${TENANTS[state.tenantId].name} não permite o perfil selecionado.`
    state.role = TENANTS[state.tenantId].allowedRoles[0]
  }
  return { state, configurationError }
}

interface AppContextValue {
  state: DemoState
  tenant: (typeof TENANTS)[TenantId]
  configurationError: string
  /** Muda a cada "Restaurar dados": telas que carregam os próprios dados usam para recarregar. */
  dataVersion: number
  selectContext: (tenantId: TenantId, role: Role) => void
  setAcademicMode: (enabled: boolean) => void
  vehiclesError: string
  saveVehicle: (vehicle: VehicleInput & { id?: string }) => Promise<Vehicle>
  deleteVehicle: (id: string) => Promise<void>
  addReservation: (reservation: Reservation) => void
  addPayment: (payment: Payment) => void
  addAccess: (access: AccessRecord) => void
  addMedicalValidation: (validation: MedicalValidation) => void
  resetDemo: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function TenantProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => readInitialState(), [])
  const [state, dispatch] = useReducer(reducer, initial.state)
  const [configurationError, setConfigurationError] = useState(initial.configurationError)
  const [vehiclesError, setVehiclesError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const location = useLocation()

  // READ: carrega os veículos do tenant ativo sempre que o tenant muda (ou após restaurar o banco)
  useEffect(() => {
    let current = true // ignora respostas antigas se o tenant mudar antes da API responder
    listVehicles(state.tenantId)
      .then((vehicles) => {
        if (!current) return
        dispatch({ type: 'SET_VEHICLES', vehicles })
        setVehiclesError('')
      })
      .catch((error: Error) => {
        if (!current) return
        dispatch({ type: 'SET_VEHICLES', vehicles: [] })
        setVehiclesError(`Não foi possível carregar os veículos: ${error.message}`)
      })
    return () => { current = false }
  }, [state.tenantId, reloadKey])

  useEffect(() => {
    // vehicles: undefined → os veículos não são gravados no localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, vehicles: undefined }))
    const params = new URLSearchParams(location.search)
    params.set('tenant', state.tenantId)
    params.set('role', state.role)
    params.set('academic', state.academicMode ? '1' : '0')
    const next = `${location.pathname}?${params.toString()}`
    window.history.replaceState(null, '', next)
  }, [location.pathname, location.search, state])

  const value = useMemo<AppContextValue>(() => ({
    state,
    tenant: TENANTS[state.tenantId],
    configurationError,
    dataVersion: reloadKey,
    vehiclesError,
    selectContext: (tenantId, role) => { dispatch({ type: 'SELECT_CONTEXT', tenantId, role }); setConfigurationError('') },
    setAcademicMode: (enabled) => dispatch({ type: 'SET_ACADEMIC', enabled }),
    // CREATE (sem id) ou UPDATE (com id): primeiro grava no banco, depois atualiza a tela
    saveVehicle: async ({ id, ...vehicle }) => {
      const saved = id ? await updateVehicle(state.tenantId, id, vehicle) : await createVehicle(state.tenantId, vehicle)
      dispatch({ type: 'SAVE_VEHICLE', vehicle: saved })
      return saved
    },
    // DELETE: remove no banco e depois da lista
    deleteVehicle: async (id) => {
      await deleteVehicle(state.tenantId, id)
      dispatch({ type: 'DELETE_VEHICLE', id })
    },
    addReservation: (reservation) => dispatch({ type: 'ADD_RESERVATION', reservation }),
    addPayment: (payment) => dispatch({ type: 'ADD_PAYMENT', payment }),
    addAccess: (access) => dispatch({ type: 'ADD_ACCESS', access }),
    addMedicalValidation: (validation) => dispatch({ type: 'ADD_MEDICAL', validation }),
    resetDemo: async () => {
      try {
        await resetDatabase()
      } catch (error) {
        setVehiclesError(`Não foi possível restaurar o banco: ${(error as Error).message}`)
      }
      dispatch({ type: 'RESET' })
      setReloadKey((key) => key + 1)
    },
  }), [configurationError, reloadKey, state, vehiclesError])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function TenantThemeProvider({ children }: { children: ReactNode }) {
  const { tenant } = useTenant()
  useEffect(() => {
    const root = document.documentElement
    Object.entries(tenant.theme).forEach(([key, value]) => root.style.setProperty(`--${key}`, value))
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tenant.theme.primary)
  }, [tenant])
  return children
}

export function useTenant() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useTenant deve ser usado dentro de TenantProvider')
  return context
}
