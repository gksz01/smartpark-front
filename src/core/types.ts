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

export type Permission =
  | 'portal'
  | 'vehicles'
  | 'dashboard'
  | 'spaces'
  | 'access'
  | 'configuration'
  | 'medicalAgreement'

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

export interface AccessRecord {
  id: string
  person: string
  plate: string
  qrCode: string
  rfid: string
  time: string
  direction: 'Entrada' | 'Saída'
  status: 'Liberado' | 'Pendente' | 'Negado'
  manual?: boolean
}

export interface ParkingSpace {
  id: string
  sector: string
  type: 'Comum' | 'PCD' | 'Elétrico' | 'Nominal' | 'Restrito'
  status: 'Livre' | 'Ocupada' | 'Bloqueada' | 'Reservada'
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
  manualAccesses: AccessRecord[]
  medicalValidations: MedicalValidation[]
}
