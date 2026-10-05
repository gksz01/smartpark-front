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

/** Algoritmos de tarifa que podem ser gravados (cada um corresponde a uma Strategy). */
export type TariffStrategyType = 'POR_HORA' | 'DIARIA' | 'ISENTA'

/** Mesmos tipos de benefício da classe de domínio Convenio. */
export type BenefitType = 'isencao' | 'percentual' | 'horasGratis'

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

/** Tarifa cadastrada no tenant (tabela tarifas). */
export interface Tariff {
  id: string
  name: string
  strategy: TariffStrategyType
  /** Valor da hora (POR_HORA) ou da diária (DIARIA); 0 na ISENTA. */
  value: number
  /** Teto diário, usado só na POR_HORA. */
  maxDaily: number | null
  active: boolean
}

/** Mesmos status da classe de domínio Reserva. */
export type ReservationStatus = 'pendente' | 'confirmada' | 'cancelada' | 'concluida'

/** Reserva do tenant (tabela reservas). */
export interface Reservation {
  id: string
  vehicleId: string
  /** Apelido e placa do veículo, vindos do JOIN com veiculos. */
  vehicleLabel: string
  spaceId: string
  spaceCode: string
  date: string
  time: string
  duration: number
  /** Calculado pela API com reserva.calcularEstimativa(tarifa ativa). */
  estimate: number
  status: ReservationStatus
}

/** Mesmas formas e status das classes de domínio Pagamento/EstrategiaPagamento. */
export type PaymentMethod = 'Pix' | 'Crédito' | 'Débito'
export type PaymentStatus = 'pendente' | 'aprovado' | 'estornado'

/** Pagamento do tenant (tabela pagamentos). Todos os valores são calculados pela API. */
export interface Payment {
  id: string
  vehicleId: string
  vehicleLabel: string
  reservationId: string | null
  attendanceNumber: string | null
  agreementName: string | null
  duration: number
  /** Valor pela tarifa ativa, antes do convênio. */
  tariffAmount: number
  /** Valor a pagar (com TarifaComConvenio quando houver atendimento). */
  amount: number
  /** Valor cobrado pela Strategy de pagamento (inclui taxa do crédito parcelado). */
  chargedAmount: number
  method: PaymentMethod
  installments: number
  detail: string
  status: PaymentStatus
  receipt: string
  createdAt: string
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

/** Convênio médico do tenant (tabela convenios). */
export interface Agreement {
  id: string
  name: string
  benefitType: BenefitType
  /** Percentual (percentual) ou quantidade de horas (horasGratis); 0 na isenção. */
  benefitValue: number
  active: boolean
  /** Quantos atendimentos usam este convênio (com atendimentos, não pode ser excluído). */
  attendanceCount: number
}

/** Resultado da validação de um atendimento (POST /api/agreements/validate). */
export interface AttendanceCheck {
  number: string
  patient: string
  agreement: string
  /** Texto de convenio.descricaoBeneficio(). */
  benefit: string
  eligible: boolean
  /** Motivo vindo de atendimento.motivoInelegibilidade(); vazio quando elegível. */
  reason: string
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
}
