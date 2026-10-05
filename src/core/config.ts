import type { AccessDirection, AccessMethod, AccessStatus, DashboardMetricId, Feature, Permission, PersonType, ReservationStatus, Role, SpaceStatus, TariffStrategyType, TenantConfig, TenantId } from './types'

export const ROLE_LABELS: Record<Role, string> = {
  driver: 'Motorista',
  operator: 'Operador',
  admin: 'Administrador',
  valet: 'Manobrista',
  resident: 'Morador',
  visitor: 'Visitante',
  employee: 'Funcionário',
}

export const FEATURE_LABELS: Record<Feature, string> = {
  reservation: 'Reserva',
  payments: 'Pagamento',
  valet: 'Manobrista',
  visitorManagement: 'Gestão de visitantes',
  medicalAgreement: 'Convênio médico',
  billing: 'Cobrança individual',
  reports: 'Relatórios',
  notifications: 'Notificações',
  whiteLabel: 'White-label',
}

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  motorista: 'Motorista',
  morador: 'Morador',
  visitante: 'Visitante',
  funcionario: 'Funcionário',
  paciente: 'Paciente',
  acompanhante: 'Acompanhante',
}

export const SPACE_STATUSES: SpaceStatus[] = ['Livre', 'Ocupada', 'Bloqueada', 'Reservada']

export const TARIFF_STRATEGY_LABELS: Record<TariffStrategyType, string> = {
  POR_HORA: 'Por hora',
  DIARIA: 'Diária fixa',
  ISENTA: 'Isenta',
}
export const TARIFF_STRATEGIES = Object.keys(TARIFF_STRATEGY_LABELS) as TariffStrategyType[]

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pendente: 'Pendente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  concluida: 'Concluída',
}

export const ACCESS_LABELS = {
  LPR: 'Leitura de placa (LPR)',
  RFID: 'Tag RFID',
  QR_CODE: 'QR Code',
  MANUAL: 'Liberação manual',
} as const

/** Como o identificador do acesso é chamado em cada método (sem ternários nas telas). */
export const ACCESS_IDENTIFIERS: Record<AccessMethod, { label: string; placeholder: string }> = {
  LPR: { label: 'Placa / LPR', placeholder: 'Ex.: ABC1D23' },
  QR_CODE: { label: 'Código QR', placeholder: 'Ex.: QR-4839-221' },
  RFID: { label: 'Tag RFID', placeholder: 'Ex.: RF-10982' },
  MANUAL: { label: 'Credencial', placeholder: 'Informe a credencial' },
}

export const ACCESS_DIRECTIONS: AccessDirection[] = ['Entrada', 'Saída']
export const ACCESS_STATUSES: AccessStatus[] = ['Liberado', 'Pendente', 'Negado']

const flags = (enabled: Feature[]): Record<Feature, boolean> => ({
  reservation: enabled.includes('reservation'),
  payments: enabled.includes('payments'),
  valet: enabled.includes('valet'),
  visitorManagement: enabled.includes('visitorManagement'),
  medicalAgreement: enabled.includes('medicalAgreement'),
  billing: enabled.includes('billing'),
  reports: enabled.includes('reports'),
  notifications: enabled.includes('notifications'),
  whiteLabel: enabled.includes('whiteLabel'),
})

export const TENANTS: Record<TenantId, TenantConfig> = {
  shopping: {
    id: 'shopping',
    name: 'Shopping Center Aurora',
    shortName: 'Aurora',
    logo: 'AU',
    eyebrow: 'Mobilidade que acompanha você',
    welcome: 'Sua vaga, do seu jeito.',
    accessMethod: 'LPR',
    features: flags(['reservation', 'payments', 'valet', 'billing', 'reports', 'notifications', 'whiteLabel']),
    allowedRoles: ['driver', 'operator', 'admin', 'valet'],
    theme: { primary: '#13795b', primaryStrong: '#0b503d', secondary: '#e9a23b', accent: '#65c18c', soft: '#edf8f3', surface: '#ffffff' },
    vehicleFields: [],
    personTypes: ['motorista', 'funcionario'],
    spaceTypes: ['Comum', 'PCD', 'Elétrico'],
    dashboardCards: ['occupancy', 'entries', 'reservations', 'revenue', 'alerts'],
  },
  condominium: {
    id: 'condominium',
    name: 'Residencial Horizonte',
    shortName: 'Horizonte',
    logo: 'RH',
    eyebrow: 'Acesso seguro, convivência tranquila',
    welcome: 'Chegar em casa ficou mais simples.',
    accessMethod: 'QR_CODE',
    features: flags(['visitorManagement', 'reports', 'notifications', 'whiteLabel']),
    allowedRoles: ['resident', 'visitor', 'operator', 'admin'],
    theme: { primary: '#2463a9', primaryStrong: '#173f72', secondary: '#6aa9e8', accent: '#f1a84b', soft: '#edf5fc', surface: '#ffffff' },
    vehicleFields: [{ key: 'unit', label: 'Unidade / apartamento', placeholder: 'Ex.: Torre B · 804' }],
    personTypes: ['morador', 'visitante'],
    spaceTypes: ['Nominal', 'Comum', 'PCD'],
    dashboardCards: ['occupancy', 'visitors', 'entries', 'exits', 'alerts'],
  },
  hospital: {
    id: 'hospital',
    name: 'Hospital Santa Clara',
    shortName: 'Santa Clara',
    logo: 'SC',
    eyebrow: 'Cuidado em todos os momentos',
    welcome: 'Acesso acolhedor e sem demora.',
    accessMethod: 'LPR',
    features: flags(['payments', 'medicalAgreement', 'billing', 'reports', 'notifications', 'whiteLabel']),
    allowedRoles: ['driver', 'visitor', 'employee', 'operator', 'admin'],
    theme: { primary: '#087c82', primaryStrong: '#07585f', secondary: '#3aa6a0', accent: '#7dc8b8', soft: '#eaf7f6', surface: '#ffffff' },
    vehicleFields: [],
    personTypes: ['paciente', 'acompanhante'],
    spaceTypes: ['Prioritária', 'Comum', 'PCD'],
    dashboardCards: ['occupancy', 'entries', 'agreements', 'alerts', 'revenue'],
  },
  company: {
    id: 'company',
    name: 'Nexora Tecnologia',
    shortName: 'Nexora',
    logo: 'NX',
    eyebrow: 'Operação que flui com o seu time',
    welcome: 'Seu acesso corporativo em um só lugar.',
    accessMethod: 'RFID',
    features: flags(['visitorManagement', 'reports', 'notifications', 'whiteLabel']),
    allowedRoles: ['employee', 'visitor', 'operator', 'admin'],
    theme: { primary: '#34445d', primaryStrong: '#1d293b', secondary: '#687b98', accent: '#df8e48', soft: '#eef1f5', surface: '#ffffff' },
    vehicleFields: [{ key: 'rfidTag', label: 'Tag RFID', placeholder: 'Ex.: NX-92841' }],
    personTypes: ['funcionario', 'visitante'],
    spaceTypes: ['Comum', 'PCD', 'Elétrico', 'Restrito'],
    dashboardCards: ['occupancy', 'employees', 'visitors', 'entries', 'alerts'],
  },
}

export const TENANT_ORDER: TenantId[] = ['shopping', 'condominium', 'hospital', 'company']
export const ROLE_ORDER: Role[] = ['driver', 'resident', 'employee', 'visitor', 'operator', 'admin', 'valet']

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  driver: ['portal', 'vehicles'],
  resident: ['portal', 'vehicles'],
  employee: ['portal', 'vehicles'],
  visitor: ['portal'],
  operator: ['spaces', 'access', 'medicalAgreement', 'users'],
  admin: ['dashboard', 'spaces', 'access', 'configuration', 'medicalAgreement', 'users'],
  valet: ['vehicles', 'access'],
}

export const METRIC_LABELS: Record<DashboardMetricId, { label: string; helper: string }> = {
  occupancy: { label: 'Ocupação atual', helper: 'de 420 vagas' },
  entries: { label: 'Entradas hoje', helper: '+8% vs. ontem' },
  exits: { label: 'Saídas hoje', helper: 'fluxo dentro do esperado' },
  reservations: { label: 'Reservas', helper: '12 para as próximas 2h' },
  revenue: { label: 'Faturamento', helper: '+12,4% no período' },
  alerts: { label: 'Alertas', helper: '2 requerem atenção' },
  agreements: { label: 'Convênios validados', helper: '31 benefícios aplicados' },
  visitors: { label: 'Visitantes', helper: '18 autorizações ativas' },
  employees: { label: 'Funcionários', helper: '146 acessos ativos' },
}

export const METRIC_VALUES: Record<DashboardMetricId, string> = {
  occupancy: '68%', entries: '284', exits: '231', reservations: '42', revenue: 'R$ 18,7 mil', alerts: '2', agreements: '31', visitors: '18', employees: '146',
}

export function isTenantId(value: string | null): value is TenantId {
  return value !== null && value in TENANTS
}

export function isRole(value: string | null): value is Role {
  return value !== null && value in ROLE_LABELS
}

export function hasPermission(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function landingForRole(role: Role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'operator' || role === 'valet') return '/admin/access'
  return '/app/home'
}
