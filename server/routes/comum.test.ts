// @vitest-environment node
import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { erroSqlite, lerTenant, texto } from './comum'

function respostaFalsa() {
  const res = { status: vi.fn(), json: vi.fn() }
  res.status.mockReturnValue(res)
  return res as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> }
}
const pedido = (tenant?: string) => ({ query: tenant ? { tenant } : {} }) as unknown as Request

describe('helpers comuns das rotas', () => {
  it('lerTenant: 400 sem tenant válido', () => {
    const res = respostaFalsa()
    expect(lerTenant(pedido('aeroporto'), res)).toBeNull()
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('lerTenant: 403 quando a feature está desligada em TENANTS', () => {
    const res = respostaFalsa()
    expect(lerTenant(pedido('condominium'), res, 'billing')).toBeNull()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ erro: 'O módulo Cobrança individual não está disponível para Residencial Horizonte.' })
  })

  it('lerTenant: devolve o tenant quando está tudo certo', () => {
    expect(lerTenant(pedido('hospital'), respostaFalsa(), 'medicalAgreement')).toBe('hospital')
  })

  it('texto e erroSqlite', () => {
    expect(texto('  Ana  ')).toBe('Ana')
    expect(texto(42)).toBe('')
    const unique = Object.assign(new Error('x'), { code: 'SQLITE_CONSTRAINT_UNIQUE' })
    expect(erroSqlite(unique, 'UNIQUE')).toBe(true)
    expect(erroSqlite(unique, 'FOREIGNKEY')).toBe(false)
    expect(erroSqlite(new Error('outro'), 'UNIQUE')).toBe(false)
  })
})
