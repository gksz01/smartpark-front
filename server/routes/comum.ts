import type { Request, Response } from 'express'
import { FEATURE_LABELS, isTenantId, TENANTS } from '../../src/core/config'
import type { Feature, TenantId } from '../../src/core/types'

/*
 * Infraestrutura repetida pelas 8 rotas (antes, cada arquivo tinha a sua cópia).
 * As regras de negócio NÃO ficam aqui: validações e fluxos continuam em cada rota.
 */

/**
 * Todo pedido precisa informar um tenant válido: /api/...?tenant=shopping (senão 400).
 * Se a rota pertence a uma feature (billing, reservation, medicalAgreement),
 * o tenant precisa tê-la ligada em TENANTS (senão 403).
 */
export function lerTenant(req: Request, res: Response, feature?: Feature): TenantId | null {
  const tenant = req.query.tenant
  if (typeof tenant !== 'string' || !isTenantId(tenant)) {
    res.status(400).json({ erro: 'Informe um tenant válido em ?tenant=' })
    return null
  }
  if (feature && !TENANTS[tenant].features[feature]) {
    res.status(403).json({ erro: `O módulo ${FEATURE_LABELS[feature]} não está disponível para ${TENANTS[tenant].name}.` })
    return null
  }
  return tenant
}

/** Texto do corpo do pedido, sem espaços nas pontas ('' quando não for texto). */
export function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

/** O erro veio de uma restrição do SQLite? (UNIQUE = valor repetido; FOREIGNKEY = registro em uso) */
export function erroSqlite(falha: unknown, restricao: 'UNIQUE' | 'FOREIGNKEY'): boolean {
  return falha instanceof Error && 'code' in falha && falha.code === `SQLITE_CONSTRAINT_${restricao}`
}

/** Responde { erro } com o status informado. */
export function enviarErro(res: Response, status: number, erro: string | null | undefined): void {
  res.status(status).json({ erro })
}
