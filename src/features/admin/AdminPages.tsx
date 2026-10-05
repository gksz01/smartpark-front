import { Activity, AlertTriangle, ArrowRight, BadgeCheck, Car, Check, CircleDollarSign, CircleParking, Clock3, DoorOpen, HeartHandshake, LogIn, LogOut, Palette, Plus, ShieldCheck, Stethoscope, TicketCheck, UserRound, UsersRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useTenant } from '../../core/app-context'
import { ACCESS_DIRECTIONS, ACCESS_IDENTIFIERS, ACCESS_LABELS, ACCESS_STATUSES, BENEFIT_TYPE_LABELS, BENEFIT_TYPES, FEATURE_LABELS, METRIC_LABELS, METRIC_VALUES, ROLE_LABELS, SPACE_STATUSES } from '../../core/config'
import { RoleGate } from '../../core/gates'
import type { AccessDirection, AccessRecord, AccessStatus, Agreement, AttendanceCheck, BenefitType, DashboardMetricId, ParkingSpace, SpaceStatus, SpaceType } from '../../core/types'
import { Convenio } from '../../domain/Convenio'
import { FormModal } from '../../shared/crud/FormModal'
import { RowActions } from '../../shared/crud/RowActions'
import { SelectField } from '../../shared/crud/SelectField'
import { createAgreement, deleteAgreement, listAgreements, updateAgreement, validateAttendance } from '../../services/agreementsApi'
import { createAccess, deleteAccess, listAccess, updateAccess } from '../../services/accessApi'
import { createSpace, deleteSpace, listSpaces, simulateSensor, updateSpace, type SpaceInput } from '../../services/spacesApi'
import { Alert, Button, Card, ConfirmDialog, DataTable, FormField, PageHeader, StatCard, StatusBadge, VariationInfo, type Column } from '../../shared/ui'

const METRIC_ICONS: Record<DashboardMetricId, typeof Activity> = {
  occupancy: CircleParking, entries: LogIn, exits: LogOut, reservations: TicketCheck, revenue: CircleDollarSign, alerts: AlertTriangle, agreements: HeartHandshake, visitors: UserRound, employees: UsersRound,
}

export function DashboardPage() {
  const { tenant, dataVersion } = useTenant()
  const [accesses, setAccesses] = useState<AccessRecord[]>([])

  // Atividade recente: os mesmos acessos gravados no banco (tela Entradas e saídas)
  useEffect(() => {
    let current = true
    listAccess(tenant.id)
      .then((list) => { if (current) setAccesses(list) })
      .catch(() => { if (current) setAccesses([]) })
    return () => { current = false }
  }, [tenant.id, dataVersion])

  const occupancy = 286 + accesses.filter((access) => access.manual && access.direction === 'Entrada').length
  return <div className="admin-page"><PageHeader eyebrow="Operação em tempo real" title={`Visão geral · ${tenant.shortName}`} description="Indicadores essenciais para a tomada de decisão de hoje." action={<div className="live-badge"><span /> Atualizado agora</div>} />
    <VariationInfo>O dashboard é uma única grade. A lista `dashboardCards` de cada tenant escolhe reservas, faturamento, convênios, visitantes ou funcionários.</VariationInfo>
    <div className="stats-grid">{tenant.dashboardCards.map((metric) => { const Icon = METRIC_ICONS[metric]; const value = metric === 'occupancy' ? `${Math.round((occupancy / 420) * 100)}%` : METRIC_VALUES[metric]; return <StatCard key={metric} label={METRIC_LABELS[metric].label} value={value} helper={METRIC_LABELS[metric].helper} icon={<Icon size={20} />} /> })}</div>
    <div className="dashboard-grid"><Card className="occupancy-card"><div className="content-heading"><div><p className="eyebrow">Distribuição por setor</p><h2>Ocupação do estacionamento</h2></div><StatusBadge tone="success">Operação normal</StatusBadge></div><div className="donut-wrap"><div className="donut" style={{ '--percent': '68%' } as React.CSSProperties}><div><strong>68%</strong><span>ocupado</span></div></div><div className="sector-bars">{[['Setor A', 82], ['Setor B', 64], ['Setor C', 47]].map(([sector, value]) => <div key={sector}><div><span>{sector}</span><strong>{value}%</strong></div><div className="mini-bar"><span style={{ width: `${value}%` }} /></div></div>)}</div></div></Card><Card><div className="content-heading"><div><p className="eyebrow">Últimos eventos</p><h2>Atividade recente</h2></div></div><div className="activity-feed">{accesses.slice(0, 4).map((access) => <div key={access.id}><span className={`activity-dot ${access.status.toLowerCase()}`} /> <div><strong>{access.person}</strong><p>{access.direction} · {access.time}</p></div><StatusBadge tone={access.status === 'Liberado' ? 'success' : access.status === 'Pendente' ? 'warning' : 'danger'}>{access.status}</StatusBadge></div>)}</div></Card></div>
  </div>
}

const SPACE_TONE = { Livre: 'success', Ocupada: 'info', Bloqueada: 'danger', Reservada: 'warning' } as const

export function SpacesPage() {
  const { tenant, dataVersion } = useTenant()
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const [status, setStatus] = useState('Todas')
  const [sector, setSector] = useState('Todos')
  const [editing, setEditing] = useState<ParkingSpace | null>(null)
  const [form, setForm] = useState<SpaceInput>({ code: '', sector: '', type: tenant.spaceTypes[0], status: 'Livre' })
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // READ: carrega as vagas do tenant ativo (e de novo após "Restaurar dados")
  useEffect(() => {
    let current = true
    listSpaces(tenant.id)
      .then((list) => {
        if (!current) return
        setSpaces(list)
        setError('')
      })
      .catch((failure: Error) => {
        if (!current) return
        setSpaces([])
        setError(`Não foi possível carregar as vagas: ${failure.message}`)
      })
    return () => { current = false }
  }, [tenant.id, dataVersion])

  // Setores vêm dos dados reais; se o setor escolhido não existir mais, mostra todos
  const sectors = [...new Set(spaces.map((space) => space.sector))].sort()
  const activeSector = sectors.includes(sector) ? sector : 'Todos'
  const visible = spaces.filter((space) => (status === 'Todas' || space.status === status) && (activeSector === 'Todos' || space.sector === activeSector))
  const counts = SPACE_STATUSES.map((item) => ({ item, count: spaces.filter((space) => space.status === item).length }))

  const openCreate = () => {
    setEditing(null)
    setForm({ code: '', sector: '', type: tenant.spaceTypes[0], status: 'Livre' })
    setFormOpen(true)
    setMessage('')
    setError('')
  }
  const openEdit = (space: ParkingSpace) => {
    setEditing(space)
    setForm({ code: space.code, sector: space.sector, type: space.type, status: space.status })
    setFormOpen(true)
    setMessage('')
    setError('')
  }
  const close = () => setFormOpen(false)

  // CREATE / UPDATE: a API usa o Creator do tipo escolhido (Factory Method) antes de gravar
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      if (editing) {
        const updated = await updateSpace(tenant.id, editing.id, form)
        setSpaces((current) => current.map((space) => space.id === updated.id ? updated : space))
        setMessage(`Vaga ${updated.code} atualizada com sucesso.`)
      } else {
        const created = await createSpace(tenant.id, form)
        setSpaces((current) => [...current, created])
        setMessage(`Vaga ${created.code} cadastrada com sucesso.`)
      }
      setFormOpen(false)
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // DELETE: a API recusa vagas Ocupadas ou Reservadas
  const confirmDelete = async (id: string) => {
    setDeleteId(null)
    try {
      await deleteSpace(tenant.id, id)
      setSpaces((current) => current.filter((space) => space.id !== id))
      setMessage('Vaga excluída.')
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // OBSERVER: o sensor lê "ocupada" numa vaga livre/reservada e "liberada" numa vaga ocupada
  const runSensor = async (space: ParkingSpace) => {
    setMessage('')
    setError('')
    try {
      const result = await simulateSensor(tenant.id, space.id, space.status === 'Ocupada' ? 'liberada' : 'ocupada')
      setSpaces((current) => current.map((item) => item.id === result.space.id ? result.space : item))
      setMessage(result.notifications.join(' ') || `Vaga ${result.space.code}: ${result.space.status}.`)
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  const columns: Column<ParkingSpace>[] = [
    { header: 'Vaga', render: (row) => <strong>{row.code}</strong> },
    { header: 'Setor', render: (row) => `Setor ${row.sector}` },
    { header: 'Categoria', render: (row) => <div><span className="inline-flex items-center gap-2"><Car size={15} />{row.type}</span><small className="table-subtitle">{row.requirement}</small></div> },
    { header: 'Status', render: (row) => <StatusBadge tone={SPACE_TONE[row.status]}>{row.status}</StatusBadge> },
    {
      header: 'Ações',
      render: (row) => (
        <RowActions label={`vaga ${row.code}`} onEdit={() => openEdit(row)} onDelete={() => setDeleteId(row.id)}>
          {row.status !== 'Bloqueada' && <Button variant="secondary" onClick={() => runSensor(row)} aria-label={`Simular sensor na vaga ${row.code}`}><Activity size={16} /> Simular sensor</Button>}
        </RowActions>
      ),
    },
  ]

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Capacidade operacional"
        title="Vagas e setores"
        description="Acompanhe disponibilidade e categorias em uma visão unificada."
        action={<Button onClick={openCreate}><Plus size={17} /> Nova vaga</Button>}
      />
      <VariationInfo>
        A mesma tabela representa todos os clientes. Os tipos oferecidos vêm de `spaceTypes` (Prioritária no Hospital, Nominal no Condomínio,
        Restrita na Empresa) e cada tipo é criado pelo seu Creator do Factory Method. &quot;Simular sensor&quot; usa o Observer: o Sensor avisa
        ObservadorVagaSensor (muda a vaga) e ObservadorNotificacaoSensor (gera a notificação).
      </VariationInfo>
      {message && <Alert>{message}</Alert>}
      {error && !formOpen && <Alert tone="danger">{error}</Alert>}

      <div className="space-summary">
        {counts.map(({ item, count }) => (
          <button key={item} onClick={() => setStatus(status === item ? 'Todas' : item)} className={status === item ? 'active' : ''}>
            <span className={`space-dot ${item.toLowerCase()}`} />
            <div><strong>{count}</strong><small>{item}s</small></div>
          </button>
        ))}
      </div>

      <Card>
        <div className="table-toolbar">
          <div>
            <h2>Mapa lógico de vagas</h2>
            <p>{visible.length} registros visíveis</p>
          </div>
          <div className="filter-selects">
            <select aria-label="Filtrar por setor" value={activeSector} onChange={(event) => setSector(event.target.value)}>
              <option>Todos</option>
              {sectors.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select aria-label="Filtrar por status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>Todas</option>
              {SPACE_STATUSES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>
        <DataTable rows={visible} columns={columns} emptyMessage="Nenhuma vaga cadastrada." />
      </Card>

      {formOpen && (
        <FormModal id="space-form" eyebrow="Cadastro de vagas" title={editing ? `Editar vaga ${editing.code}` : 'Nova vaga'} error={error} submitLabel="Salvar vaga" onSubmit={submit} onClose={close}>
          <FormField label="Código">
            <input required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="Ex.: A-05" />
          </FormField>
          <FormField label="Setor">
            <input required value={form.sector} onChange={(event) => setForm({ ...form, sector: event.target.value })} placeholder="Ex.: A" />
          </FormField>
          <FormField label="Tipo">
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as SpaceType })}>
              {tenant.spaceTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </FormField>
          <FormField label="Status">
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as SpaceStatus })}>
              {SPACE_STATUSES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </FormField>
        </FormModal>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Excluir vaga?"
          description="Somente vagas livres ou bloqueadas podem ser excluídas."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => confirmDelete(deleteId)}
        />
      )}
    </div>
  )
}

const EMPTY_ACCESS_FORM = { person: '', identifier: '', direction: 'Entrada' as AccessDirection, status: 'Liberado' as AccessStatus, denialReason: '' }

export function AccessPage() {
  const { tenant, dataVersion } = useTenant()
  const [rows, setRows] = useState<AccessRecord[]>([])
  const [editing, setEditing] = useState<AccessRecord | null>(null)
  const [form, setForm] = useState(EMPTY_ACCESS_FORM)
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  // Rótulo e exemplo do identificador vêm do accessMethod do tenant (placa, QR ou RFID)
  const identifier = ACCESS_IDENTIFIERS[tenant.accessMethod]

  // READ: carrega os acessos do tenant ativo (e de novo após "Restaurar dados")
  useEffect(() => {
    let current = true
    listAccess(tenant.id)
      .then((list) => {
        if (!current) return
        setRows(list)
        setError('')
      })
      .catch((failure: Error) => {
        if (!current) return
        setRows([])
        setError(`Não foi possível carregar os acessos: ${failure.message}`)
      })
    return () => { current = false }
  }, [tenant.id, dataVersion])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_ACCESS_FORM)
    setOpen(true)
    setMessage('')
    setError('')
  }
  const openEdit = (row: AccessRecord) => {
    setEditing(row)
    setForm({ person: row.person, identifier: row.identifier, direction: row.direction, status: row.status, denialReason: row.denialReason })
    setOpen(true)
    setMessage('')
    setError('')
  }
  const close = () => setOpen(false)

  // CREATE (liberação manual) / UPDATE (editar ou decidir um acesso pendente)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const input = { ...form, method: tenant.accessMethod }
    try {
      if (editing) {
        const updated = await updateAccess(tenant.id, editing.id, input)
        setRows((current) => current.map((row) => row.id === updated.id ? updated : row))
        setMessage(`Acesso de ${updated.person} atualizado.`)
      } else {
        const created = await createAccess(tenant.id, input)
        setRows((current) => [created, ...current])
        setMessage(`${created.direction} de ${created.person} liberada manualmente.`)
      }
      setOpen(false)
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // DELETE
  const confirmDelete = async (id: string) => {
    setDeleteId(null)
    try {
      await deleteAccess(tenant.id, id)
      setRows((current) => current.filter((row) => row.id !== id))
      setMessage('Registro de acesso excluído.')
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // Regra da classe Acesso: só um acesso Pendente pode ser liberado ou negado
  const statusLocked = editing !== null && editing.status !== 'Pendente'

  const columns: Column<AccessRecord>[] = [
    { header: 'Identificação', render: (row) => <div><strong>{row.identifier}</strong>{row.manual && <small className="table-subtitle">Liberação manual</small>}</div> },
    { header: 'Usuário', render: (row) => row.person },
    { header: 'Horário', render: (row) => <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{row.time}</span> },
    { header: 'Movimento', render: (row) => <span className="inline-flex items-center gap-1.5">{row.direction === 'Entrada' ? <LogIn size={15} /> : <LogOut size={15} />}{row.direction}</span> },
    { header: 'Status', render: (row) => <div><StatusBadge tone={row.status === 'Liberado' ? 'success' : row.status === 'Pendente' ? 'warning' : 'danger'}>{row.status}</StatusBadge>{row.denialReason && <small className="table-subtitle">{row.denialReason}</small>}</div> },
    {
      header: 'Ações',
      render: (row) => (
        <RoleGate roles={['operator', 'admin']}>
          <RowActions label={`acesso de ${row.person}`} onEdit={() => openEdit(row)} onDelete={() => setDeleteId(row.id)} />
        </RoleGate>
      ),
    },
  ]

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Portaria inteligente"
        title="Entradas e saídas"
        description={`Identificação principal: ${ACCESS_LABELS[tenant.accessMethod]}.`}
        action={<RoleGate roles={['operator', 'admin']}><Button onClick={openCreate}><DoorOpen size={17} /> Liberação manual</Button></RoleGate>}
      />
      <VariationInfo>
        A coluna de identificação acompanha `accessMethod`: placa no LPR, código no QR Code e tag no RFID. A ação manual permanece reutilizável para perfis autorizados.
      </VariationInfo>
      {message && <Alert>{message}</Alert>}
      {error && !open && <Alert tone="danger">{error}</Alert>}
      <div className="access-kpis">
        <Card><span><LogIn /></span><div><strong>284</strong><small>Entradas hoje</small></div></Card>
        <Card><span><LogOut /></span><div><strong>231</strong><small>Saídas hoje</small></div></Card>
        <Card><span><ShieldCheck /></span><div><strong>98,7%</strong><small>Liberações automáticas</small></div></Card>
      </div>
      <Card>
        <div className="table-toolbar">
          <div>
            <h2>Fluxo recente</h2>
            <p>{rows.length} acessos exibidos</p>
          </div>
          <StatusBadge tone="info">{identifier.label}</StatusBadge>
        </div>
        <DataTable rows={rows} columns={columns} emptyMessage="Nenhum acesso registrado." />
      </Card>

      {open && (
        <FormModal
          id="access"
          eyebrow="Ação de operador"
          title={editing ? 'Editar acesso' : 'Liberação manual'}
          description={editing ? 'Corrija os dados ou decida um acesso pendente.' : 'Registre uma exceção auditável para entrada ou saída.'}
          error={error}
          submitLabel={editing ? 'Salvar acesso' : 'Confirmar liberação'}
          cancelLabel={null}
          onSubmit={submit}
          onClose={close}
        >
          {/* Campos explícitos: o rótulo do identificador vem do accessMethod e o status segue as regras da classe Acesso */}
          <FormField label="Nome do usuário">
            <input required value={form.person} onChange={(event) => setForm({ ...form, person: event.target.value })} placeholder="Nome completo" />
          </FormField>
          <FormField label={identifier.label}>
            <input required value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} placeholder={identifier.placeholder} />
          </FormField>
          <SelectField label="Movimento" value={form.direction} options={ACCESS_DIRECTIONS} onChange={(direction) => setForm({ ...form, direction: direction as AccessDirection })} />
          {editing && (
            <SelectField
              label="Status"
              value={form.status}
              options={ACCESS_STATUSES}
              disabled={statusLocked}
              hint={statusLocked ? `Acesso já ${editing.status.toLowerCase()}: o status não pode mais mudar.` : undefined}
              onChange={(status) => setForm({ ...form, status: status as AccessStatus })}
            />
          )}
          {form.status === 'Negado' && (
            <FormField label="Motivo da negação">
              <input required value={form.denialReason} onChange={(event) => setForm({ ...form, denialReason: event.target.value })} placeholder="Ex.: Credencial expirada" />
            </FormField>
          )}
        </FormModal>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Excluir registro de acesso?"
          description="O registro será removido do histórico de entradas e saídas."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => confirmDelete(deleteId)}
        />
      )}
    </div>
  )
}

export function ConfigurationPage() {
  const { tenant } = useTenant()
  return <div className="admin-page"><PageHeader eyebrow="Composição do produto" title="Módulos e personalização" description="Visualize como esta instância foi montada para o cliente ativo." />
    <VariationInfo>Esta tela torna a Linha de Produto visível: tema, método de acesso, perfis e módulos vêm do mesmo objeto `TenantConfig` consumido por menus e rotas.</VariationInfo>
    <div className="config-grid"><Card className="tenant-config-card"><div className="config-logo">{tenant.logo}</div><div><p className="eyebrow">Cliente ativo</p><h2>{tenant.name}</h2><p>{tenant.eyebrow}</p></div><div className="config-access"><ShieldCheck size={18} /><span>Método de acesso</span><strong>{ACCESS_LABELS[tenant.accessMethod]}</strong></div></Card><Card><div className="content-heading"><div><p className="eyebrow">White-label</p><h2>Tokens do tema</h2></div><Palette /></div><div className="theme-swatches">{Object.entries(tenant.theme).map(([name, color]) => <div key={name}><span style={{ background: color }} /><small>{name}</small><strong>{color}</strong></div>)}</div></Card></div>
    <div className="config-grid lower"><Card><div className="content-heading"><div><p className="eyebrow">Feature flags</p><h2>Módulos desta composição</h2></div></div><div className="feature-switches">{Object.entries(tenant.features).map(([feature, enabled]) => <div key={feature}><span><strong>{FEATURE_LABELS[feature as keyof typeof FEATURE_LABELS]}</strong><small>{enabled ? 'Disponível nesta variante' : 'Removido desta variante'}</small></span><span className={`readonly-switch ${enabled ? 'on' : ''}`} role="switch" aria-checked={enabled} aria-readonly="true"><i />{enabled ? 'ON' : 'OFF'}</span></div>)}</div></Card><Card><div className="content-heading"><div><p className="eyebrow">RBAC</p><h2>Perfis permitidos</h2></div></div><div className="allowed-roles">{tenant.allowedRoles.map((role) => <div key={role}><span><UserRound size={17} /></span><strong>{ROLE_LABELS[role]}</strong><BadgeCheck size={17} /></div>)}</div><Alert tone="warning"><strong>Configuração demonstrativa.</strong><br />Os controles são somente leitura para preservar a matriz acadêmica.</Alert></Card></div>
  </div>
}

const MEDICAL_STEPS = ['Atendimento', 'Localização', 'Elegibilidade', 'Benefício', 'Pagamento']
const EMPTY_AGREEMENT_FORM = { name: '', benefitType: 'isencao' as BenefitType, benefitValue: '', active: true }
const BENEFIT_VALUE_LABELS: Record<BenefitType, string> = { isencao: '', percentual: 'Percentual de desconto (%)', horasGratis: 'Horas grátis' }

/** A descrição do benefício vem da classe de domínio Convenio. */
function benefitDescription(agreement: Agreement): string {
  return new Convenio(agreement.id, agreement.name, agreement.benefitType, agreement.benefitValue, agreement.active).descricaoBeneficio()
}

export function MedicalAgreementPage() {
  const { tenant, dataVersion } = useTenant()
  // Área 1: validação de atendimento
  const [attendance, setAttendance] = useState('')
  const [found, setFound] = useState<AttendanceCheck | null>(null)
  const [searchError, setSearchError] = useState('')
  // Área 2: convênios cadastrados (CRUD)
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [editing, setEditing] = useState<Agreement | null>(null)
  const [form, setForm] = useState(EMPTY_AGREEMENT_FORM)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // READ: carrega os convênios do tenant ativo (e de novo após "Restaurar dados")
  useEffect(() => {
    let current = true
    listAgreements(tenant.id)
      .then((list) => {
        if (!current) return
        setAgreements(list)
        setError('')
      })
      .catch((failure: Error) => {
        if (!current) return
        setAgreements([])
        setError(`Não foi possível carregar os convênios: ${failure.message}`)
      })
    return () => { current = false }
  }, [tenant.id, dataVersion])

  // Validação: a API usa Atendimento.validarElegibilidade() e não consome o benefício
  const search = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setFound(await validateAttendance(tenant.id, attendance))
      setSearchError('')
    } catch (failure) {
      setFound(null)
      setSearchError(`${(failure as Error).message} Tente ATD-48291.`)
    }
  }
  const resetSearch = () => {
    setAttendance('')
    setFound(null)
    setSearchError('')
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_AGREEMENT_FORM)
    setFormOpen(true)
    setMessage('')
    setError('')
  }
  const openEdit = (agreement: Agreement) => {
    setEditing(agreement)
    setForm({ name: agreement.name, benefitType: agreement.benefitType, benefitValue: String(agreement.benefitValue), active: agreement.active })
    setFormOpen(true)
    setMessage('')
    setError('')
  }
  const close = () => setFormOpen(false)

  // CREATE / UPDATE
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const input = { name: form.name, benefitType: form.benefitType, benefitValue: form.benefitType === 'isencao' ? 0 : Number(form.benefitValue), active: form.active }
    try {
      if (editing) {
        const updated = await updateAgreement(tenant.id, editing.id, input)
        setAgreements((current) => current.map((agreement) => agreement.id === updated.id ? updated : agreement))
        setMessage(`Convênio ${updated.name} atualizado com sucesso.`)
      } else {
        const created = await createAgreement(tenant.id, input)
        setAgreements((current) => [...current, created])
        setMessage(`Convênio ${created.name} cadastrado com sucesso.`)
      }
      setFormOpen(false)
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // DELETE: a API recusa convênios com atendimentos vinculados
  const confirmDelete = async (id: string) => {
    setDeleteId(null)
    try {
      await deleteAgreement(tenant.id, id)
      setAgreements((current) => current.filter((agreement) => agreement.id !== id))
      setMessage('Convênio excluído.')
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  const stepDone = (index: number) => found !== null && (found.eligible ? index < 4 : index < 2)

  const columns: Column<Agreement>[] = [
    { header: 'Convênio', render: (row) => <strong>{row.name}</strong> },
    { header: 'Benefício', render: (row) => benefitDescription(row) },
    { header: 'Atendimentos', render: (row) => row.attendanceCount },
    { header: 'Situação', render: (row) => <StatusBadge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Ativo' : 'Inativo'}</StatusBadge> },
    {
      header: 'Ações',
      render: (row) => (
        <RowActions label={`${row.name}`} onEdit={() => openEdit(row)} onDelete={() => setDeleteId(row.id)} />
      ),
    },
  ]

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Módulo exclusivo do Hospital"
        title="Convênio médico"
        description="Valide o benefício de estacionamento associado a um atendimento."
        action={<StatusBadge tone="success"><Stethoscope size={14} /> Hospital</StatusBadge>}
      />
      <VariationInfo>
        O módulo está separado do núcleo e só é ativado por `medicalAgreement` (menu, rota, tela e API). Convênios e atendimentos vêm do banco;
        a elegibilidade é decidida pela classe Atendimento e a descrição do benefício pela classe Convenio.
      </VariationInfo>

      <div className="medical-steps">
        {MEDICAL_STEPS.map((step, index) => (
          <div key={step} className={stepDone(index) ? 'done' : index === 0 && !found ? 'active' : ''}>
            <span>{stepDone(index) ? <Check size={14} /> : index + 1}</span>
            <small>{step}</small>
          </div>
        ))}
      </div>

      <div className="medical-grid">
        <Card className="medical-search">
          <div className="medical-icon"><HeartHandshake size={28} /></div>
          <p className="eyebrow">Etapa 1</p>
          <h2>Localizar atendimento</h2>
          <p>Informe o número recebido na recepção ou o código do convênio.</p>
          <form onSubmit={search}>
            <FormField label="Número do atendimento">
              <input required value={attendance} onChange={(event) => setAttendance(event.target.value)} placeholder="Ex.: ATD-48291" />
            </FormField>
            <Button type="submit" className="w-full justify-center">Localizar atendimento <ArrowRight size={17} /></Button>
          </form>
          <small className="demo-hint">Para demonstrar, use <button onClick={() => setAttendance('ATD-48291')}>ATD-48291</button>.</small>
          {searchError && <Alert tone="danger">{searchError}</Alert>}
        </Card>

        <Card className={`eligibility-card ${found ? 'visible' : ''}`}>
          {found ? (
            <>
              <div className="eligibility-header">
                <span>{found.eligible ? <BadgeCheck size={22} /> : <AlertTriangle size={22} />}</span>
                <div><p className="eyebrow">Atendimento localizado</p><h2>{found.eligible ? 'Elegível para benefício' : 'Não elegível'}</h2></div>
              </div>
              <div className="patient-card">
                <span><UserRound size={22} /></span>
                <div><small>Paciente</small><strong>{found.patient}</strong><p>{found.number}</p></div>
              </div>
              <div className="eligibility-lines">
                <span>Convênio <strong>{found.agreement}</strong></span>
                <span>Elegibilidade <StatusBadge tone={found.eligible ? 'success' : 'danger'}>{found.eligible ? 'Ativa' : 'Recusada'}</StatusBadge></span>
                <span>Benefício <strong>{found.benefit}</strong></span>
              </div>
              {found.eligible
                ? <Alert><strong>Elegibilidade validada.</strong><br />O benefício será aplicado no pagamento do estacionamento.</Alert>
                : <Alert tone="danger"><strong>Benefício indisponível.</strong><br />{found.reason}</Alert>}
              <Button variant="secondary" className="w-full justify-center" onClick={resetSearch}>Nova validação</Button>
            </>
          ) : (
            <div className="medical-placeholder">
              <span><Stethoscope size={32} /></span>
              <h2>Aguardando consulta</h2>
              <p>Os dados do paciente, elegibilidade e benefício aparecerão aqui.</p>
            </div>
          )}
        </Card>
      </div>

      <section className="content-section">
        {message && <Alert>{message}</Alert>}
        {error && !formOpen && <Alert tone="danger">{error}</Alert>}
        <Card>
          <div className="table-toolbar">
            <div>
              <h2>Convênios cadastrados</h2>
              <p>{agreements.length} convênios · com atendimentos vinculados não podem ser excluídos</p>
            </div>
            <Button onClick={openCreate}><Plus size={17} /> Novo convênio</Button>
          </div>
          <DataTable rows={agreements} columns={columns} emptyMessage="Nenhum convênio cadastrado." />
        </Card>
      </section>

      {formOpen && (
        <FormModal id="agreement-form" eyebrow="Cadastro de convênios" title={editing ? 'Editar convênio' : 'Novo convênio'} error={error} submitLabel="Salvar convênio" onSubmit={submit} onClose={close}>
          <FormField label="Nome">
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Saúde Plena" />
          </FormField>
          <FormField label="Tipo de benefício">
            <select value={form.benefitType} onChange={(event) => setForm({ ...form, benefitType: event.target.value as BenefitType })}>
              {BENEFIT_TYPES.map((type) => <option key={type} value={type}>{BENEFIT_TYPE_LABELS[type]}</option>)}
            </select>
          </FormField>
          {form.benefitType !== 'isencao' && (
            <FormField label={BENEFIT_VALUE_LABELS[form.benefitType]}>
              <input required type="number" min="1" max={form.benefitType === 'percentual' ? 100 : undefined} step="1" value={form.benefitValue} onChange={(event) => setForm({ ...form, benefitValue: event.target.value })} />
            </FormField>
          )}
          <FormField label="Situação">
            <select value={form.active ? 'ativo' : 'inativo'} onChange={(event) => setForm({ ...form, active: event.target.value === 'ativo' })}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </FormField>
        </FormModal>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Excluir convênio?"
          description="Somente convênios sem atendimentos vinculados podem ser excluídos."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => confirmDelete(deleteId)}
        />
      )}
    </div>
  )
}
