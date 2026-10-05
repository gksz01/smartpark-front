import type { Agreement, AttendanceCheck, TenantId } from '../core/types'
import { createCrudApi, request } from './api'

/** Dados enviados no formulário (id e attendanceCount vêm da API). */
export type AgreementInput = Omit<Agreement, 'id' | 'attendanceCount'>

// CRUD padrão em /api/agreements
const agreements = createCrudApi<Agreement, AgreementInput>('agreements')
export const listAgreements = agreements.list
export const createAgreement = agreements.create
export const updateAgreement = agreements.update
export const deleteAgreement = agreements.remove

// Validação de atendimento — POST /api/agreements/validate (não consome o benefício)
export function validateAttendance(tenantId: TenantId, number: string): Promise<AttendanceCheck> {
  return request(tenantId, 'agreements/validate', 'POST', { number })
}
