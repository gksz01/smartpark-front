import { vi } from 'vitest'
import type { TenantId } from '../core/types'

interface FakeOptions<Item, Input> {
  /** Como montar o item salvo (campos que a API real calcularia). Padrão: { ...input, id }. */
  build?: (input: Input, id: string, previous?: Item) => Item
  /** Itens novos entram no início da lista (padrão: no fim). */
  prepend?: boolean
  /** Ajuste da lista antes de salvar (ex.: só uma tarifa ativa). */
  beforeSave?: (items: Item[], input: Input) => Item[]
}

/*
 * API falsa em memória, por tenant, para os testes de interface.
 * Gera list/create/update/remove como vi.fn (os testes podem usar mockRejectedValueOnce)
 * e helpers para as ações próprias de cada API (cancelar, estornar, sensor...).
 */
export function createFakeCrudApi<Item extends { id: string }, Input>(initial: Record<TenantId, Item[]>, options: FakeOptions<Item, Input> = {}) {
  let items = structuredClone(initial)
  let nextId = 100
  const build = options.build ?? ((input: Input, id: string) => ({ ...input, id }) as unknown as Item)
  const beforeSave = (tenantId: TenantId, input: Input) => {
    if (options.beforeSave) items[tenantId] = options.beforeSave(items[tenantId], input)
  }

  const newId = () => String(nextId++)
  const find = (tenantId: TenantId, id: string) => items[tenantId].find((item) => item.id === id)!
  const add = (tenantId: TenantId, item: Item) => {
    items[tenantId] = options.prepend ? [item, ...items[tenantId]] : [...items[tenantId], item]
    return item
  }
  const replace = (tenantId: TenantId, item: Item) => {
    items[tenantId] = items[tenantId].map((current) => current.id === item.id ? item : current)
    return item
  }

  return {
    reset: () => {
      items = structuredClone(initial)
      nextId = 100
    },
    newId,
    find,
    add,
    replace,
    list: vi.fn(async (tenantId: TenantId) => items[tenantId]),
    create: vi.fn(async (tenantId: TenantId, input: Input) => {
      beforeSave(tenantId, input)
      return add(tenantId, build(input, newId()))
    }),
    update: vi.fn(async (tenantId: TenantId, id: string, input: Input) => {
      beforeSave(tenantId, input)
      return replace(tenantId, build(input, id, find(tenantId, id)))
    }),
    remove: vi.fn(async (tenantId: TenantId, id: string) => {
      items[tenantId] = items[tenantId].filter((item) => item.id !== id)
    }),
  }
}
