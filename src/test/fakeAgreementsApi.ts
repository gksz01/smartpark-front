import { vi } from 'vitest'
import type { Agreement, AttendanceCheck, TenantId } from '../core/types'
import type { AgreementInput } from '../services/agreementsApi'

/*
 * Substitui src/services/agreementsApi.ts nos testes de interface (ver setup.ts).
 * As regras reais (Convenio, Atendimento, 24h, foreign key) são testadas no backend.
 */

const INITIAL: Record<TenantId, Agreement[]> = {
  hospital: [
    { id: '1', name: 'Saúde Plena', benefitType: 'isencao', benefitValue: 0, active: true, attendanceCount: 2 },
    { id: '2', name: 'VidaCare', benefitType: 'percentual', benefitValue: 50, active: true, attendanceCount: 2 },
    { id: '3', name: 'Bem Estar', benefitType: 'horasGratis', benefitValue: 2, active: true, attendanceCount: 1 },
    { id: '5', name: 'MedSul', benefitType: 'horasGratis', benefitValue: 1, active: true, attendanceCount: 0 },
  ],
  shopping: [],
  condominium: [],
  company: [],
}

const ATTENDANCES: Record<string, AttendanceCheck> = {
  'ATD-48291': { number: 'ATD-48291', patient: 'Helena Moreira', agreement: 'Saúde Plena', benefit: 'Isenção de 100%', eligible: true, reason: '' },
  'ATD-55120': { number: 'ATD-55120', patient: 'João Lima', agreement: 'Plano Antigo', benefit: 'Desconto de 30%', eligible: false, reason: 'O convênio Plano Antigo está inativo.' },
}

let agreements = structuredClone(INITIAL)
let nextId = 100

export function resetFakeAgreements() {
  agreements = structuredClone(INITIAL)
  nextId = 100
}

export const listAgreements = vi.fn(async (tenantId: TenantId) => agreements[tenantId])

export const createAgreement = vi.fn(async (tenantId: TenantId, input: AgreementInput) => {
  const created = { ...input, id: String(nextId++), attendanceCount: 0 }
  agreements[tenantId] = [...agreements[tenantId], created]
  return created
})

export const updateAgreement = vi.fn(async (tenantId: TenantId, id: string, input: AgreementInput) => {
  const previous = agreements[tenantId].find((agreement) => agreement.id === id)!
  const updated = { ...previous, ...input }
  agreements[tenantId] = agreements[tenantId].map((agreement) => agreement.id === id ? updated : agreement)
  return updated
})

export const deleteAgreement = vi.fn(async (tenantId: TenantId, id: string) => {
  agreements[tenantId] = agreements[tenantId].filter((agreement) => agreement.id !== id)
})

export const validateAttendance = vi.fn(async (_tenantId: TenantId, number: string) => {
  const found = ATTENDANCES[number.trim().toUpperCase()]
  if (!found) throw new Error('Atendimento não localizado.')
  return found
})
