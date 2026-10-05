import { createFakeCrudApi } from './createFakeCrudApi'
import type { AccessRecord, TenantId } from '../core/types'
import type { AccessInput } from '../services/accessApi'

/*
 * Substitui src/services/accessApi.ts nos testes de interface (ver setup.ts),
 * guardando os acessos em memória por tenant. O backend real é testado em server/.
 */

const INITIAL: Record<TenantId, AccessRecord[]> = {
  shopping: [
    { id: '1', person: 'Marina Costa', identifier: 'BRA2E19', method: 'LPR', direction: 'Entrada', status: 'Liberado', manual: false, denialReason: '', time: '14:32' },
    { id: '2', person: 'Bruno Dias', identifier: 'DFK4J86', method: 'LPR', direction: 'Entrada', status: 'Pendente', manual: false, denialReason: '', time: '13:54' },
    { id: '3', person: 'Carlos Nunes', identifier: 'SPK1A23', method: 'LPR', direction: 'Entrada', status: 'Negado', manual: false, denialReason: 'Placa sem cadastro', time: '13:41' },
  ],
  condominium: [{ id: '4', person: 'Juliana Reis', identifier: 'QR-4839-221', method: 'QR_CODE', direction: 'Entrada', status: 'Liberado', manual: false, denialReason: '', time: '14:05' }],
  hospital: [{ id: '5', person: 'Helena Moreira', identifier: 'HSP2C34', method: 'LPR', direction: 'Entrada', status: 'Liberado', manual: false, denialReason: '', time: '14:40' }],
  company: [{ id: '6', person: 'Lucas Martins', identifier: 'RF-10982', method: 'RFID', direction: 'Entrada', status: 'Liberado', manual: false, denialReason: '', time: '08:55' }],
}

// Como a API real: o acesso novo é manual, entra no topo e a edição mantém os demais campos
const accesses = createFakeCrudApi<AccessRecord, AccessInput>(INITIAL, {
  prepend: true,
  build: (input, id, previous) => previous ? { ...previous, ...input } : { ...input, id, manual: true, time: '15:00' },
})

export const resetFakeAccess = accesses.reset
export const listAccess = accesses.list
export const createAccess = accesses.create
export const updateAccess = accesses.update
export const deleteAccess = accesses.remove
