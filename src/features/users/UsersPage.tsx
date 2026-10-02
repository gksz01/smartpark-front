import { Edit3, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useTenant } from '../../core/app-context'
import { PERSON_TYPE_LABELS, ROLE_LABELS } from '../../core/config'
import type { PersonType, Role, User } from '../../core/types'
import { Usuario } from '../../domain/Usuario'
import { createUser, deleteUser, listUsers, updateUser, type UserInput } from '../../services/usersApi'
import { Alert, Button, Card, ConfirmDialog, DataTable, FormField, PageHeader, StatusBadge, VariationInfo, type Column } from '../../shared/ui'

export function UsersPage() {
  const { tenant, dataVersion } = useTenant()
  const [users, setUsers] = useState<User[]>([])
  const [typeFilter, setTypeFilter] = useState<PersonType | 'todos'>('todos')
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<UserInput>({ name: '', document: '', type: tenant.personTypes[0], role: tenant.allowedRoles[0], active: true })
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // READ: carrega as pessoas do tenant ativo (e de novo após "Restaurar dados")
  useEffect(() => {
    let current = true
    listUsers(tenant.id)
      .then((list) => {
        if (!current) return
        setUsers(list)
        setError('')
      })
      .catch((failure: Error) => {
        if (!current) return
        setUsers([])
        setError(`Não foi possível carregar as pessoas: ${failure.message}`)
      })
    return () => { current = false }
  }, [tenant.id, dataVersion])

  // Se o filtro escolhido não existir no tenant atual, mostra todos
  const activeFilter = typeFilter !== 'todos' && tenant.personTypes.includes(typeFilter) ? typeFilter : 'todos'
  const visible = users.filter((user) => activeFilter === 'todos' || user.type === activeFilter)

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', document: '', type: tenant.personTypes[0], role: tenant.allowedRoles[0], active: true })
    setFormOpen(true)
    setMessage('')
    setError('')
  }
  const openEdit = (user: User) => {
    setEditing(user)
    setForm({ name: user.name, document: user.document, type: user.type, role: user.role, active: user.active })
    setFormOpen(true)
    setMessage('')
    setError('')
  }
  const close = () => setFormOpen(false)

  // CREATE / UPDATE
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      if (editing) {
        const updated = await updateUser(tenant.id, editing.id, form)
        setUsers((current) => current.map((user) => user.id === updated.id ? updated : user))
        setMessage('Pessoa atualizada com sucesso.')
      } else {
        const created = await createUser(tenant.id, form)
        setUsers((current) => [...current, created])
        setMessage('Pessoa cadastrada com sucesso.')
      }
      setFormOpen(false)
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // DELETE
  const confirmDelete = async (id: string) => {
    setDeleteId(null)
    try {
      await deleteUser(tenant.id, id)
      setUsers((current) => current.filter((user) => user.id !== id))
      setMessage('Pessoa excluída.')
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // A classe de domínio Usuario decide o destaque do tipo
  const typeTone = (user: User) => {
    const usuario = new Usuario(user.id, user.name, user.document, user.role, user.type, tenant.id, user.active)
    if (usuario.ehVisitante()) return 'warning'
    if (usuario.ehPacienteOuAcompanhante()) return 'info'
    return 'neutral'
  }

  const columns: Column<User>[] = [
    { header: 'Nome', render: (row) => <div><strong>{row.name}</strong><small className="table-subtitle">{row.document}</small></div> },
    { header: 'Tipo', render: (row) => <StatusBadge tone={typeTone(row)}>{PERSON_TYPE_LABELS[row.type]}</StatusBadge> },
    { header: 'Perfil', render: (row) => ROLE_LABELS[row.role] },
    { header: 'Situação', render: (row) => <StatusBadge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Ativo' : 'Inativo'}</StatusBadge> },
    {
      header: 'Ações',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openEdit(row)} aria-label={`Editar ${row.name}`}><Edit3 size={16} /> Editar</Button>
          <Button variant="ghost" onClick={() => setDeleteId(row.id)} aria-label={`Excluir ${row.name}`}><Trash2 size={16} /> Excluir</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Cadastro de pessoas"
        title="Pessoas"
        description={`Pessoas autorizadas a utilizar o estacionamento de ${tenant.name}.`}
        action={<Button onClick={openCreate}><Plus size={17} /> Nova pessoa</Button>}
      />
      <VariationInfo>
        Os tipos de pessoa vêm de `personTypes` e os perfis de `allowedRoles` do tenant: pacientes e acompanhantes no Hospital,
        moradores e visitantes no Condomínio, funcionários e visitantes na Empresa, motoristas e funcionários no Shopping.
      </VariationInfo>
      {message && <Alert>{message}</Alert>}
      {error && !formOpen && <Alert tone="danger">{error}</Alert>}

      <Card>
        <div className="table-toolbar">
          <div>
            <h2>Pessoas cadastradas</h2>
            <p>{visible.length} registros visíveis</p>
          </div>
          <div className="filter-selects">
            <select aria-label="Filtrar por tipo" value={activeFilter} onChange={(event) => setTypeFilter(event.target.value as PersonType | 'todos')}>
              <option value="todos">Todos os tipos</option>
              {tenant.personTypes.map((type) => <option key={type} value={type}>{PERSON_TYPE_LABELS[type]}</option>)}
            </select>
          </div>
        </div>
        <DataTable rows={visible} columns={columns} emptyMessage="Nenhuma pessoa cadastrada." />
      </Card>

      {formOpen && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="user-form-title">
            <button type="button" className="modal-close" onClick={close} aria-label="Fechar"><X size={18} /></button>
            <p className="eyebrow">Cadastro de pessoas</p>
            <h2 id="user-form-title">{editing ? 'Editar pessoa' : 'Nova pessoa'}</h2>
            <div className="mt-6 space-y-4">
              <FormField label="Nome">
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome completo" />
              </FormField>
              <FormField label="Documento">
                <input required value={form.document} onChange={(event) => setForm({ ...form, document: event.target.value })} placeholder="CPF ou RG" />
              </FormField>
              <FormField label="Tipo">
                <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as PersonType })}>
                  {tenant.personTypes.map((type) => <option key={type} value={type}>{PERSON_TYPE_LABELS[type]}</option>)}
                </select>
              </FormField>
              <FormField label="Perfil">
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
                  {tenant.allowedRoles.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                </select>
              </FormField>
              <FormField label="Situação">
                <select value={form.active ? 'ativo' : 'inativo'} onChange={(event) => setForm({ ...form, active: event.target.value === 'ativo' })}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </FormField>
            </div>
            {error && <div className="mt-5"><Alert tone="danger">{error}</Alert></div>}
            <div className="mt-7 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
              <Button type="submit">Salvar pessoa</Button>
            </div>
          </form>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Excluir pessoa?"
          description="O cadastro será removido deste cliente."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => confirmDelete(deleteId)}
        />
      )}
    </div>
  )
}
