import { act, renderHook, waitFor } from '@testing-library/react'
import type { FormEvent, ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TenantProvider } from '../../core/app-context'
import type { TenantId } from '../../core/types'
import { useCrudForm } from './useCrudForm'
import { useTenantData } from './useTenantData'

const wrapper = ({ children }: { children: ReactNode }) => <BrowserRouter><TenantProvider>{children}</TenantProvider></BrowserRouter>
const evento = { preventDefault: vi.fn() } as unknown as FormEvent
type Item = { id: string; name: string }

afterEach(() => localStorage.clear())

describe('useTenantData', () => {
  it('carrega os dados do tenant ativo e recarrega sob demanda', async () => {
    window.history.replaceState({}, '', '/?tenant=hospital&role=admin')
    const carregar = vi.fn(async (tenantId: TenantId) => [`dados de ${tenantId}`])
    const { result } = renderHook(() => useTenantData(carregar, [] as string[], 'Erro'), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual(['dados de hospital']))
    await act(() => result.current.reload())
    expect(carregar).toHaveBeenCalledTimes(2)
  })

  it('em caso de falha, volta ao valor inicial e informa o erro', async () => {
    const falhar = vi.fn(async () => { throw new Error('offline') })
    const { result } = renderHook(() => useTenantData(falhar, ['inicial'], 'Não foi possível carregar'), { wrapper })
    await waitFor(() => expect(result.current.error).toBe('Não foi possível carregar: offline'))
    expect(result.current.data).toEqual(['inicial'])
  })
})

describe('useCrudForm', () => {
  function montar(extra: Partial<Parameters<typeof useCrudForm<Item, { name: string }>>[0]> = {}) {
    let items: Item[] = [{ id: '1', name: 'Ana' }]
    const setItems = vi.fn((update: Item[] | ((atual: Item[]) => Item[])) => { items = typeof update === 'function' ? update(items) : update })
    const hook = renderHook(() => useCrudForm<Item, { name: string }>({
      emptyForm: () => ({ name: '' }),
      toForm: (item) => ({ name: item.name }),
      create: async (input) => ({ id: '2', ...input }),
      update: async (id, input) => ({ id, ...input }),
      remove: async () => undefined,
      messages: { created: (item) => `${item.name} criado`, updated: (item) => `${item.name} alterado`, deleted: 'excluído' },
      setItems,
      ...extra,
    }))
    return { hook, lista: () => items }
  }

  it('cria, edita e exclui atualizando a lista e as mensagens', async () => {
    const { hook, lista } = montar()
    act(() => hook.result.current.openCreate())
    act(() => hook.result.current.setForm({ name: 'Bia' }))
    await act(() => hook.result.current.submit(evento))
    expect(hook.result.current.message).toBe('Bia criado')
    expect(hook.result.current.formOpen).toBe(false)

    act(() => hook.result.current.openEdit({ id: '1', name: 'Ana' }))
    expect(hook.result.current.form).toEqual({ name: 'Ana' })
    act(() => hook.result.current.setForm({ name: 'Ana Paula' }))
    await act(() => hook.result.current.submit(evento))
    expect(hook.result.current.message).toBe('Ana Paula alterado')

    await act(() => hook.result.current.confirmDelete('2'))
    expect(hook.result.current.message).toBe('excluído')
    expect(lista()).toEqual([{ id: '1', name: 'Ana Paula' }])
  })

  it('erro da API fica no formulário, que continua aberto', async () => {
    const { hook } = montar({ create: async () => { throw new Error('Documento repetido.') } })
    act(() => hook.result.current.openCreate())
    await act(() => hook.result.current.submit(evento))
    expect(hook.result.current.error).toBe('Documento repetido.')
    expect(hook.result.current.formOpen).toBe(true)
  })

  it('addToStart coloca o item novo no início; reload é chamado depois de salvar', async () => {
    const reload = vi.fn(async () => undefined)
    const { hook, lista } = montar({ addToStart: true, reload })
    act(() => hook.result.current.openCreate())
    await act(() => hook.result.current.submit(evento))
    expect(lista()[0].id).toBe('2')
    expect(reload).toHaveBeenCalled()
  })
})
