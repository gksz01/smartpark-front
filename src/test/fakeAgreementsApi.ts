import { vi } from 'vitest'
import { createFakeCrudApi } from './createFakeCrudApi'
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

const agreements = createFakeCrudApi<Agreement, AgreementInput>(INITIAL, {
  build: (input, id, previous) => previous ? { ...previous, ...input } : { ...input, id, attendanceCount: 0 },
})

export const resetFakeAgreements = agreements.reset
export const listAgreements = agreements.list
export const createAgreement = agreements.create
export const updateAgreement = agreements.update
export const deleteAgreement = agreements.remove

export const validateAttendance = vi.fn(async (_tenantId: TenantId, number: string) => {
  const found = ATTENDANCES[number.trim().toUpperCase()]
  if (!found) throw new Error('Atendimento não localizado.')
  return found
})
