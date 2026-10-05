import type { TenantId } from '../core/types'

/**
 * Lê a resposta da API. Se o status não for de sucesso,
 * lança um Error com a mensagem enviada pelo backend ({ erro: '...' }).
 */
export async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.erro ?? `Erro ${response.status} ao acessar a API.`)
  }
  if (response.status === 204) return undefined as T
  return response.json()
}

/**
 * Chamada à API de um tenant: /api/<caminho>?tenant=<id>.
 * Quando há corpo, ele vai em JSON. Todos os serviços usam esta função.
 */
export async function request<T>(tenantId: TenantId, path: string, method = 'GET', body?: unknown): Promise<T> {
  const options: RequestInit = body === undefined ? { method } : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  return readResponse(await fetch(`/api/${path}?tenant=${tenantId}`, options))
}

/**
 * As 4 chamadas padrão de um recurso:
 * GET e POST em /api/<recurso>; PUT e DELETE em /api/<recurso>/:id.
 */
export function createCrudApi<Item, Input>(resource: string) {
  return {
    list: (tenantId: TenantId) => request<Item[]>(tenantId, resource),
    create: (tenantId: TenantId, input: Input) => request<Item>(tenantId, resource, 'POST', input),
    update: (tenantId: TenantId, id: string, input: Input) => request<Item>(tenantId, `${resource}/${id}`, 'PUT', input),
    remove: (tenantId: TenantId, id: string) => request<void>(tenantId, `${resource}/${id}`, 'DELETE'),
  }
}

/** Restaura o banco com os dados de demonstração (POST /api/reset). */
export async function resetDatabase(): Promise<void> {
  await readResponse(await fetch('/api/reset', { method: 'POST' }))
}
