// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCrudApi, request } from './api'

function respostaJson(status: number, corpo: unknown) {
  return new Response(status === 204 ? null : JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

type FetchFalso = (url: string, options?: RequestInit) => Promise<Response>

afterEach(() => vi.unstubAllGlobals())

describe('request() e createCrudApi()', () => {
  it('monta /api/<recurso>?tenant= e envia o corpo em JSON', async () => {
    const fetchFalso = vi.fn<FetchFalso>(async () => respostaJson(201, { id: '1' }))
    vi.stubGlobal('fetch', fetchFalso)
    await request('hospital', 'users', 'POST', { name: 'Ana' })
    expect(fetchFalso).toHaveBeenCalledWith('/api/users?tenant=hospital', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"name":"Ana"}' })
  })

  it('createCrudApi gera as 4 chamadas padrão do recurso', async () => {
    const fetchFalso = vi.fn<FetchFalso>(async () => respostaJson(200, []))
    vi.stubGlobal('fetch', fetchFalso)
    const api = createCrudApi<{ id: string }, { name: string }>('users')
    await api.list('shopping')
    await api.create('shopping', { name: 'Ana' })
    await api.update('shopping', '7', { name: 'Ana' })
    fetchFalso.mockResolvedValueOnce(respostaJson(204, null))
    await api.remove('shopping', '7')
    expect(fetchFalso.mock.calls.map(([url, options]) => `${options?.method} ${url}`)).toEqual([
      'GET /api/users?tenant=shopping',
      'POST /api/users?tenant=shopping',
      'PUT /api/users/7?tenant=shopping',
      'DELETE /api/users/7?tenant=shopping',
    ])
  })

  it('erro da API vira Error com a mensagem do backend', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaJson(409, { erro: 'Já existe.' })))
    await expect(request('shopping', 'users')).rejects.toThrow('Já existe.')
  })
})
