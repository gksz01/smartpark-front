import { CheckCircle2, Plus } from 'lucide-react'
import { useTenant } from '../../core/app-context'
import { TARIFF_STRATEGIES, TARIFF_STRATEGY_LABELS } from '../../core/config'
import type { Tariff, TariffStrategyType } from '../../core/types'
import { CRIAR_ESTRATEGIA } from '../../domain/strategies/tarifa/estrategiaPorTipo'
import { Tarifa } from '../../domain/Tarifa'
import { createTariff, deleteTariff, listTariffs, updateTariff, type TariffInput } from '../../services/tariffsApi'
import { FormFields, type FieldConfig } from '../../shared/crud/FormFields'
import { FormModal } from '../../shared/crud/FormModal'
import { useCrudForm } from '../../shared/crud/useCrudForm'
import { useTenantData } from '../../shared/crud/useTenantData'
import { RowActions } from '../../shared/crud/RowActions'
import { Alert, Button, Card, ConfirmDialog, DataTable, PageHeader, StatusBadge, VariationInfo, type Column } from '../../shared/ui'
import { formatarMoeda } from '../../domain/formatacao'

const EMPTY_FORM = { name: '', strategy: 'POR_HORA' as TariffStrategyType, value: '', maxDaily: '', active: false }

const VALUE_LABELS: Record<TariffStrategyType, string> = {
  POR_HORA: 'Valor da hora (R$)',
  DIARIA: 'Valor da diária (R$)',
  ISENTA: '',
}

/** Campos do formulário: só o que cada tipo de cálculo usa (o cálculo em si fica na Strategy). */
const TARIFF_FIELDS: FieldConfig<typeof EMPTY_FORM>[] = [
  { name: 'name', label: 'Nome', type: 'text', placeholder: 'Ex.: Tarifa padrão' },
  { name: 'strategy', label: 'Tipo de cálculo', type: 'select', options: TARIFF_STRATEGIES.map((strategy) => ({ value: strategy, label: TARIFF_STRATEGY_LABELS[strategy] })) },
  { name: 'value', label: (form) => VALUE_LABELS[form.strategy], type: 'number', visible: (form) => form.strategy !== 'ISENTA', attributes: { min: '0.01', step: '0.01' } },
  { name: 'maxDaily', label: 'Teto diário (R$)', hint: 'Opcional', type: 'number', optional: true, visible: (form) => form.strategy === 'POR_HORA', attributes: { min: '0.01', step: '0.01' } },
  { name: 'active', label: 'Situação', type: 'boolean', choices: [{ key: 'inativa', label: 'Inativa', value: false }, { key: 'ativa', label: 'Ativa (desativa a atual)', value: true }] },
]

/** Monta a Tarifa (Context) com a Strategy gravada no banco. */
function toTarifa(row: Tariff): Tarifa {
  const estrategia = CRIAR_ESTRATEGIA[row.strategy]({ tipo: row.strategy, valor: row.value, valorMaximoDiario: row.maxDaily })
  return new Tarifa(row.id, row.name, estrategia)
}

// Formulário → dados da API: só a tarifa por hora usa teto; a isenta não usa valor
function toInput(form: typeof EMPTY_FORM): TariffInput {
  return {
    name: form.name,
    strategy: form.strategy,
    value: form.strategy === 'ISENTA' ? 0 : Number(form.value),
    maxDaily: form.strategy === 'POR_HORA' && form.maxDaily !== '' ? Number(form.maxDaily) : null,
    active: form.active,
  }
}

export function TariffsPage() {
  const { tenant } = useTenant()
  // READ: tarifas do tenant ativo
  const list = useTenantData(listTariffs, [] as Tariff[], 'Não foi possível carregar as tarifas')
  // CREATE / UPDATE / DELETE. Depois de salvar, recarrega: ativar uma tarifa desativa a anterior (regra da API)
  const crud = useCrudForm<Tariff, typeof EMPTY_FORM, TariffInput>({
    emptyForm: () => EMPTY_FORM,
    toForm: (tariff) => ({ name: tariff.name, strategy: tariff.strategy, value: String(tariff.value), maxDaily: tariff.maxDaily === null ? '' : String(tariff.maxDaily), active: tariff.active }),
    toInput,
    create: (input) => createTariff(tenant.id, input),
    update: (id, input) => updateTariff(tenant.id, id, input),
    remove: (id) => deleteTariff(tenant.id, id),
    messages: { created: (tariff) => `Tarifa ${tariff.name} cadastrada com sucesso.`, updated: (tariff) => `Tarifa ${tariff.name} atualizada com sucesso.`, deleted: 'Tarifa excluída.' },
    setItems: list.setData,
    reload: list.reload,
  })
  const { form, setForm, error } = crud
  const tariffs = list.data

  // UPDATE rápido: ativar (fluxo próprio de Tarifas)
  const activate = async (tariff: Tariff) => {
    crud.setMessage('')
    crud.setError('')
    try {
      await updateTariff(tenant.id, tariff.id, { name: tariff.name, strategy: tariff.strategy, value: tariff.value, maxDaily: tariff.maxDaily, active: true })
      await list.reload()
      crud.setMessage(`Tarifa ${tariff.name} ativada. A anterior foi desativada.`)
    } catch (failure) {
      crud.setError((failure as Error).message)
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
        <RowActions label={`${row.name}`} onEdit={() => crud.openEdit(row)} onDelete={() => crud.askDelete(row.id)}>
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
        action={<Button onClick={crud.openCreate}><Plus size={17} /> Nova tarifa</Button>}
      />
      <VariationInfo>
        Esta tela só existe quando a feature `billing` está ligada (Shopping e Hospital). Cada tipo de cálculo é uma Strategy:
        a coluna &quot;Simulação 3h&quot; chama `tarifa.calcular(3)` e a classe Tarifa delega para TarifaPorHora, TarifaFixaDiaria ou TarifaIsenta.
      </VariationInfo>
      {crud.message && <Alert>{crud.message}</Alert>}
      {(error || list.error) && !crud.formOpen && <Alert tone="danger">{error || list.error}</Alert>}

      <Card>
        <div className="table-toolbar">
          <div>
            <h2>Tarifas cadastradas</h2>
            <p>{tariffs.length} tarifas · no máximo uma ativa</p>
          </div>
        </div>
        <DataTable rows={tariffs} columns={columns} emptyMessage="Nenhuma tarifa cadastrada." />
      </Card>

      {crud.formOpen && (
        <FormModal id="tariff-form" eyebrow="Cadastro de tarifas" title={crud.editing ? 'Editar tarifa' : 'Nova tarifa'} error={error} submitLabel="Salvar tarifa" onSubmit={crud.submit} onClose={crud.close}>
          <FormFields fields={TARIFF_FIELDS} form={form} onChange={setForm} />
        </FormModal>
      )}

      {crud.deleteId && (
        <ConfirmDialog
          title="Excluir tarifa?"
          description="Somente tarifas inativas podem ser excluídas."
          onCancel={crud.cancelDelete}
          onConfirm={() => crud.confirmDelete()}
        />
      )}
    </div>
  )
}
