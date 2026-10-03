export type TenantId = 'shopping' | 'condominium' | 'hospital' | 'company'

export type Role =
  | 'driver'
  | 'operator'
  | 'admin'
  | 'valet'
  | 'resident'
  | 'visitor'
  | 'employee'

export type Feature =
  | 'reservation'
  | 'payments'
  | 'valet'
  | 'visitorManagement'
  | 'medicalAgreement'
  | 'billing'
  | 'reports'
  | 'notifications'
  | 'whiteLabel'

export type AccessMethod = 'LPR' | 'RFID' | 'QR_CODE' | 'MANUAL'
export type AccessDirection = 'Entrada' | 'Saída'
export type AccessStatus = 'Liberado' | 'Pendente' | 'Negado'

/** Tipos de vaga. Cada tenant escolhe os seus em spaceTypes; cada tipo tem um Creator (Factory Method). */
export type SpaceType = 'Comum' | 'PCD' | 'Elétrico' | 'Nominal' | 'Restrito' | 'Prioritária'
export type SpaceStatus = 'Livre' | 'Ocupada' | 'Bloqueada' | 'Reservada'

/** Tipos de pessoa cadastráveis. Cada tenant escolhe os seus em personTypes. */
export type PersonType = 'motorista' | 'morador' | 'visitante' | 'funcionario' | 'paciente' | 'acompanhante'

export type Permission =
  | 'portal'
  | 'vehicles'
  | 'dashboard'
  | 'spaces'
  | 'access'
  | 'configuration'
  | 'medicalAgreement'
  | 'users'

export interface ThemeTokens {
  primary: string
  primaryStrong: string
  secondary: string
  accent: string
  soft: string
  surface: string
}

export interface VehicleFieldConfig {
  key: 'rfidTag' | 'unit'
  label: string
  placeholder: string
}

export interface TenantConfig {
  id: TenantId
  name: string
  shortName: string
  logo: string
  eyebrow: string
  welcome: string
  accessMethod: AccessMethod
  features: Record<Feature, boolean>
  allowedRoles: Role[]
  theme: ThemeTokens
  vehicleFields: VehicleFieldConfig[]
  personTypes: PersonType[]
  spaceTypes: SpaceType[]
  dashboardCards: DashboardMetricId[]
}

export interface Parking {
  id: string
  name: string
  address: string
  distance: string
  available: number
  total: number
  pricePerHour: number
  open24h: boolean
  restricted: boolean
  services: string[]
  sector: string
}

export interface Vehicle {
  id: string
  plate: string
  model: string
  color: string
  nickname: string
  rfidTag?: string
  unit?: string
}

/** Pessoa cadastrada no tenant (tabela usuarios). */
export interface User {
  id: string
  name: string
  document: string
  type: PersonType
  role: Role
  active: boolean
}

export interface Reservation {
  id: string
  parkingId: string
  date: string
  time: string
  duration: number
  vehicleId: string
  estimate: number
  status: 'confirmed' | 'completed'
}

export interface Payment {
  id: string
  vehicleId: string
  period: string
  amount: number
  method: string
  createdAt: string
  receipt: string
}

/** Entrada ou saída registrada no tenant (tabela acessos). */
export interface AccessRecord {
  id: string
  person: string
  /** Placa (LPR), código (QR_CODE) ou tag (RFID), conforme o accessMethod do tenant. */
  identifier: string
  method: AccessMethod
  direction: AccessDirection
  status: AccessStatus
  manual: boolean
  denialReason: string
  /** Horário no formato HH:MM, vindo de Acesso.horarioFormatado(). */
  time: string
}

/** Vaga cadastrada no tenant (tabela vagas). */
export interface ParkingSpace {
  id: string
  code: string
  sector: string
  type: SpaceType
  status: SpaceStatus
  /** Texto vindo de requisitoDeUso() da subclasse de Vaga criada pelo Factory Method. */
  requirement: string
}

export interface MedicalValidation {
  id: string
  attendanceNumber: string
  patient: string
  agreement: string
  benefit: string
  createdAt: string
}

export type DashboardMetricId =
  | 'occupancy'
  | 'entries'
  | 'exits'
  | 'reservations'
  | 'revenue'
  | 'alerts'
  | 'agreements'
  | 'visitors'
  | 'employees'

export interface DemoState {
  tenantId: TenantId
  role: Role
  academicMode: boolean
  vehicles: Vehicle[]
  reservations: Reservation[]
  payments: Payment[]
  medicalValidations: MedicalValidation[]
}
