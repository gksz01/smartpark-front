import { CheckCircle2, Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useTenant } from '../../core/app-context'
import { TARIFF_STRATEGIES, TARIFF_STRATEGY_LABELS } from '../../core/config'
import type { Tariff, TariffStrategyType } from '../../core/types'
import { CRIAR_ESTRATEGIA } from '../../domain/strategies/tarifa/estrategiaPorTipo'
import { Tarifa } from '../../domain/Tarifa'
import { createTariff, deleteTariff, listTariffs, updateTariff, type TariffInput } from '../../services/tariffsApi'
import { FormModal } from '../../shared/crud/FormModal'
import { RowActions } from '../../shared/crud/RowActions'
import { Alert, Button, Card, ConfirmDialog, DataTable, FormField, PageHeader, StatusBadge, VariationInfo, type Column } from '../../shared/ui'
import { formatarMoeda } from '../../domain/formatacao'

const EMPTY_FORM = { name: '', strategy: 'POR_HORA' as TariffStrategyType, value: '', maxDaily: '', active: false }

const VALUE_LABELS: Record<TariffStrategyType, string> = {
  POR_HORA: 'Valor da hora (R$)',
  DIARIA: 'Valor da diária (R$)',
  ISENTA: '',
}

/** Monta a Tarifa (Context) com a Strategy gravada no banco. */
function toTarifa(row: Tariff): Tarifa {
  const estrategia = CRIAR_ESTRATEGIA[row.strategy]({ tipo: row.strategy, valor: row.value, valorMaximoDiario: row.maxDaily })
  return new Tarifa(row.id, row.name, estrategia)
}

export function TariffsPage() {
  const { tenant, dataVersion } = useTenant()
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [editing, setEditing] = useState<Tariff | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // READ: carrega as tarifas do tenant ativo (e de novo após "Restaurar dados")
  useEffect(() => {
    let current = true
    listTariffs(tenant.id)
      .then((list) => {
        if (!current) return
        setTariffs(list)
        setError('')
      })
      .catch((failure: Error) => {
        if (!current) return
        setTariffs([])
        setError(`Não foi possível carregar as tarifas: ${failure.message}`)
      })
    return () => { current = false }
  }, [tenant.id, dataVersion])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
    setMessage('')
    setError('')
  }
  const openEdit = (tariff: Tariff) => {
    setEditing(tariff)
    setForm({ name: tariff.name, strategy: tariff.strategy, value: String(tariff.value), maxDaily: tariff.maxDaily === null ? '' : String(tariff.maxDaily), active: tariff.active })
    setFormOpen(true)
    setMessage('')
    setError('')
  }
  const close = () => setFormOpen(false)

  // Converte o formulário: só a tarifa por hora usa teto; a isenta não usa valor
  const toInput = (): TariffInput => ({
    name: form.name,
    strategy: form.strategy,
    value: form.strategy === 'ISENTA' ? 0 : Number(form.value),
    maxDaily: form.strategy === 'POR_HORA' && form.maxDaily !== '' ? Number(form.maxDaily) : null,
    active: form.active,
  })

  // CREATE / UPDATE: depois de salvar, recarrega a lista (ativar uma tarifa desativa a anterior)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      if (editing) {
        await updateTariff(tenant.id, editing.id, toInput())
        setMessage(`Tarifa ${form.name} atualizada com sucesso.`)
      } else {
        await createTariff(tenant.id, toInput())
        setMessage(`Tarifa ${form.name} cadastrada com sucesso.`)
      }
      setTariffs(await listTariffs(tenant.id))
      setFormOpen(false)
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // UPDATE rápido: ativar
  const activate = async (tariff: Tariff) => {
    setMessage('')
    setError('')
    try {
      await updateTariff(tenant.id, tariff.id, { name: tariff.name, strategy: tariff.strategy, value: tariff.value, maxDaily: tariff.maxDaily, active: true })
      setTariffs(await listTariffs(tenant.id))
      setMessage(`Tarifa ${tariff.name} ativada. A anterior foi desativada.`)
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // DELETE: a API recusa a tarifa ativa
  const confirmDelete = async (id: string) => {
    setDeleteId(null)
    try {
      await deleteTariff(tenant.id, id)
      setTariffs((current) => current.filter((tariff) => tariff.id !== id))
      setMessage('Tarifa excluída.')
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  const columns: Column<Tariff>[] = [
    { header: 'Nome', render: (row) => <strong>{row.name}</strong> },
    { header: 'Tipo', render: (row) => TARIFF_STRATEGY_LABELS[row.strategy] },
    // descricao() e calcular(3) vêm da Strategy, por meio da classe Tarifa
    { header: 'Configuração', render: (row) => toTarifa(row).estrategia.descricao() },
    { header: 'Simulação 3h', render: (row) => <strong>{formatarMoeda(toTarifa(row).calcular(3))}</strong> },
    { header: 'Situação', render: (row) => <StatusBadge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Ativa' : 'Inativa'}</StatusBadge> },
    {
      header: 'Ações',
      render: (row) => (
        <RowActions label={`${row.name}`} onEdit={() => openEdit(row)} onDelete={() => setDeleteId(row.id)}>
          {!row.active && <Button variant="secondary" onClick={() => activate(row)} aria-label={`Ativar ${row.name}`}><CheckCircle2 size={16} /> Ativar</Button>}
        </RowActions>
      ),
    },
  ]

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Cobrança"
        title="Tarifas"
        description={`Regras de preço do estacionamento de ${tenant.name}. A tarifa ativa será usada em reservas e pagamentos.`}
        action={<Button onClick={openCreate}><Plus size={17} /> Nova tarifa</Button>}
      />
      <VariationInfo>
        Esta tela só existe quando a feature `billing` está ligada (Shopping e Hospital). Cada tipo de cálculo é uma Strategy:
        a coluna &quot;Simulação 3h&quot; chama `tarifa.calcular(3)` e a classe Tarifa delega para TarifaPorHora, TarifaFixaDiaria ou TarifaIsenta.
      </VariationInfo>
      {message && <Alert>{message}</Alert>}
      {error && !formOpen && <Alert tone="danger">{error}</Alert>}

      <Card>
        <div className="table-toolbar">
          <div>
            <h2>Tarifas cadastradas</h2>
            <p>{tariffs.length} tarifas · no máximo uma ativa</p>
          </div>
        </div>
        <DataTable rows={tariffs} columns={columns} emptyMessage="Nenhuma tarifa cadastrada." />
      </Card>

      {formOpen && (
        <FormModal id="tariff-form" eyebrow="Cadastro de tarifas" title={editing ? 'Editar tarifa' : 'Nova tarifa'} error={error} submitLabel="Salvar tarifa" onSubmit={submit} onClose={close}>
          <FormField label="Nome">
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Tarifa padrão" />
          </FormField>
          <FormField label="Tipo de cálculo">
            <select value={form.strategy} onChange={(event) => setForm({ ...form, strategy: event.target.value as TariffStrategyType })}>
              {TARIFF_STRATEGIES.map((strategy) => <option key={strategy} value={strategy}>{TARIFF_STRATEGY_LABELS[strategy]}</option>)}
            </select>
          </FormField>
          {form.strategy !== 'ISENTA' && (
            <FormField label={VALUE_LABELS[form.strategy]}>
              <input required type="number" min="0.01" step="0.01" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />
            </FormField>
          )}
          {form.strategy === 'POR_HORA' && (
            <FormField label="Teto diário (R$)" hint="Opcional">
              <input type="number" min="0.01" step="0.01" value={form.maxDaily} onChange={(event) => setForm({ ...form, maxDaily: event.target.value })} />
            </FormField>
          )}
          <FormField label="Situação">
            <select value={form.active ? 'ativa' : 'inativa'} onChange={(event) => setForm({ ...form, active: event.target.value === 'ativa' })}>
              <option value="inativa">Inativa</option>
              <option value="ativa">Ativa (desativa a atual)</option>
            </select>
          </FormField>
        </FormModal>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Excluir tarifa?"
          description="Somente tarifas inativas podem ser excluídas."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => confirmDelete(deleteId)}
        />
      )}
    </div>
  )
}
