import { useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'

interface CrudFormOptions<Item extends { id: string }, Form, Input> {
  /** Formulário vazio (função, pois pode depender do tenant: primeiro tipo, primeiro perfil...) */
  emptyForm: () => Form
  /** Item → formulário preenchido para edição */
  toForm: (item: Item) => Form
  /** Formulário → dados enviados à API (padrão: o próprio formulário) */
  toInput?: (form: Form) => Input
  create: (input: Input) => Promise<Item>
  update: (id: string, input: Input) => Promise<Item>
  remove: (id: string) => Promise<void>
  messages: { created: (item: Item) => string; updated: (item: Item) => string; deleted: string }
  /** Lista da tela (de useTenantData). Sem ela, a lista é atualizada por quem chamou (ex.: Veículos no contexto). */
  setItems?: Dispatch<SetStateAction<Item[]>>
  /** Itens novos no início da lista (padrão: no fim) */
  addToStart?: boolean
  /** Recarregar a lista depois de salvar (ex.: ativar uma tarifa desativa outra) */
  reload?: () => Promise<void>
}

/**
 * Fluxo de formulário de um CRUD: novo, editar, fechar, salvar (create ou update),
 * confirmar exclusão, mensagem de sucesso e erro da API.
 * As regras de negócio continuam na API e nas classes de domínio.
 */
export function useCrudForm<Item extends { id: string }, Form, Input = Form>(options: CrudFormOptions<Item, Form, Input>) {
  const [editing, setEditing] = useState<Item | null>(null)
  const [form, setForm] = useState<Form>(options.emptyForm)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const open = (item: Item | null) => {
    setEditing(item)
    setForm(item ? options.toForm(item) : options.emptyForm())
    setFormOpen(true)
    setMessage('')
    setError('')
  }

  // CREATE / UPDATE
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const input = options.toInput ? options.toInput(form) : (form as unknown as Input)
    try {
      if (editing) {
        const updated = await options.update(editing.id, input)
        options.setItems?.((items) => items.map((item) => item.id === updated.id ? updated : item))
        setMessage(options.messages.updated(updated))
      } else {
        const created = await options.create(input)
        options.setItems?.((items) => options.addToStart ? [created, ...items] : [...items, created])
        setMessage(options.messages.created(created))
      }
      if (options.reload) await options.reload()
      setFormOpen(false)
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // DELETE (depois do ConfirmDialog; por padrão, o item que aguarda confirmação)
  const confirmDelete = async (id: string | null = deleteId) => {
    if (!id) return
    setDeleteId(null)
    try {
      await options.remove(id)
      options.setItems?.((items) => items.filter((item) => item.id !== id))
      setMessage(options.messages.deleted)
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  return {
    form, setForm, editing, formOpen, deleteId, message, error, setMessage, setError,
    openCreate: () => open(null),
    openEdit: (item: Item) => open(item),
    close: () => setFormOpen(false),
    submit,
    askDelete: (id: string) => setDeleteId(id),
    cancelDelete: () => setDeleteId(null),
    confirmDelete,
  }
}
