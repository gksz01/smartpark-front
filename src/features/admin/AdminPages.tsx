import { Activity, AlertTriangle, ArrowRight, BadgeCheck, Car, Check, CircleDollarSign, CircleParking, Clock3, DoorOpen, Edit3, HeartHandshake, LogIn, LogOut, Palette, Plus, ShieldCheck, Stethoscope, TicketCheck, Trash2, UserRound, UsersRound, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useTenant } from '../../core/app-context'
import { ACCESS_LABELS, FEATURE_LABELS, METRIC_LABELS, METRIC_VALUES, ROLE_LABELS, SPACE_STATUSES } from '../../core/config'
import { RoleGate } from '../../core/gates'
import type { AccessRecord, DashboardMetricId, MedicalValidation, ParkingSpace, SpaceStatus, SpaceType } from '../../core/types'
import { ACCESS_RECORDS } from '../../data/mocks'
import { createSpace, deleteSpace, listSpaces, updateSpace, type SpaceInput } from '../../services/spacesApi'
import { Alert, Button, Card, ConfirmDialog, DataTable, FormField, PageHeader, StatCard, StatusBadge, VariationInfo, type Column } from '../../shared/ui'

const METRIC_ICONS: Record<DashboardMetricId, typeof Activity> = {
  occupancy: CircleParking, entries: LogIn, exits: LogOut, reservations: TicketCheck, revenue: CircleDollarSign, alerts: AlertTriangle, agreements: HeartHandshake, visitors: UserRound, employees: UsersRound,
}

export function DashboardPage() {
  const { tenant, state } = useTenant()
  const occupancy = 286 + state.manualAccesses.filter((access) => access.direction === 'Entrada').length
  return <div className="admin-page"><PageHeader eyebrow="Operação em tempo real" title={`Visão geral · ${tenant.shortName}`} description="Indicadores essenciais para a tomada de decisão de hoje." action={<div className="live-badge"><span /> Atualizado agora</div>} />
    <VariationInfo>O dashboard é uma única grade. A lista `dashboardCards` de cada tenant escolhe reservas, faturamento, convênios, visitantes ou funcionários.</VariationInfo>
    <div className="stats-grid">{tenant.dashboardCards.map((metric) => { const Icon = METRIC_ICONS[metric]; const value = metric === 'occupancy' ? `${Math.round((occupancy / 420) * 100)}%` : METRIC_VALUES[metric]; return <StatCard key={metric} label={METRIC_LABELS[metric].label} value={value} helper={METRIC_LABELS[metric].helper} icon={<Icon size={20} />} /> })}</div>
    <div className="dashboard-grid"><Card className="occupancy-card"><div className="content-heading"><div><p className="eyebrow">Distribuição por setor</p><h2>Ocupação do estacionamento</h2></div><StatusBadge tone="success">Operação normal</StatusBadge></div><div className="donut-wrap"><div className="donut" style={{ '--percent': '68%' } as React.CSSProperties}><div><strong>68%</strong><span>ocupado</span></div></div><div className="sector-bars">{[['Setor A', 82], ['Setor B', 64], ['Setor C', 47]].map(([sector, value]) => <div key={sector}><div><span>{sector}</span><strong>{value}%</strong></div><div className="mini-bar"><span style={{ width: `${value}%` }} /></div></div>)}</div></div></Card><Card><div className="content-heading"><div><p className="eyebrow">Últimos eventos</p><h2>Atividade recente</h2></div></div><div className="activity-feed">{[...state.manualAccesses, ...ACCESS_RECORDS].slice(0, 4).map((access) => <div key={access.id}><span className={`activity-dot ${access.status.toLowerCase()}`} /> <div><strong>{access.person}</strong><p>{access.direction} · {access.time}</p></div><StatusBadge tone={access.status === 'Liberado' ? 'success' : access.status === 'Pendente' ? 'warning' : 'danger'}>{access.status}</StatusBadge></div>)}</div></Card></div>
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

  const columns: Column<ParkingSpace>[] = [
    { header: 'Vaga', render: (row) => <strong>{row.code}</strong> },
    { header: 'Setor', render: (row) => `Setor ${row.sector}` },
    { header: 'Categoria', render: (row) => <div><span className="inline-flex items-center gap-2"><Car size={15} />{row.type}</span><small className="table-subtitle">{row.requirement}</small></div> },
    { header: 'Status', render: (row) => <StatusBadge tone={SPACE_TONE[row.status]}>{row.status}</StatusBadge> },
    {
      header: 'Ações',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openEdit(row)} aria-label={`Editar vaga ${row.code}`}><Edit3 size={16} /> Editar</Button>
          <Button variant="ghost" onClick={() => setDeleteId(row.id)} aria-label={`Excluir vaga ${row.code}`}><Trash2 size={16} /> Excluir</Button>
        </div>
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
        Restrita na Empresa) e cada tipo é criado pelo seu Creator do Factory Method.
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
        <div className="modal-backdrop">
          <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="space-form-title">
            <button type="button" className="modal-close" onClick={close} aria-label="Fechar"><X size={18} /></button>
            <p className="eyebrow">Cadastro de vagas</p>
            <h2 id="space-form-title">{editing ? `Editar vaga ${editing.code}` : 'Nova vaga'}</h2>
            <div className="mt-6 space-y-4">
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
            </div>
            {error && <div className="mt-5"><Alert tone="danger">{error}</Alert></div>}
            <div className="mt-7 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
              <Button type="submit">Salvar vaga</Button>
            </div>
          </form>
        </div>
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

export function AccessPage() {
  const { tenant, state, addAccess } = useTenant()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ person: '', identifier: '', direction: 'Entrada' as 'Entrada' | 'Saída' })
  const rows = [...state.manualAccesses, ...ACCESS_RECORDS]
  const identifierLabel = tenant.accessMethod === 'LPR' ? 'Placa / LPR' : tenant.accessMethod === 'QR_CODE' ? 'Código QR' : 'Tag RFID'
  const identifierFor = (row: AccessRecord) => tenant.accessMethod === 'LPR' ? row.plate : tenant.accessMethod === 'QR_CODE' ? row.qrCode : row.rfid
  const columns: Column<AccessRecord>[] = [
    { header: 'Identificação', render: (row) => <div><strong>{identifierFor(row)}</strong>{row.manual && <small className="table-subtitle">Liberação manual</small>}</div> },
    { header: 'Usuário', render: (row) => row.person },
    { header: 'Horário', render: (row) => <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{row.time}</span> },
    { header: 'Movimento', render: (row) => <span className="inline-flex items-center gap-1.5">{row.direction === 'Entrada' ? <LogIn size={15} /> : <LogOut size={15} />}{row.direction}</span> },
    { header: 'Status', render: (row) => <StatusBadge tone={row.status === 'Liberado' ? 'success' : row.status === 'Pendente' ? 'warning' : 'danger'}>{row.status}</StatusBadge> },
  ]
  const submit = (event: FormEvent) => { event.preventDefault(); const record: AccessRecord = { id: crypto.randomUUID(), person: form.person, plate: tenant.accessMethod === 'LPR' ? form.identifier.toUpperCase() : 'MANUAL', qrCode: tenant.accessMethod === 'QR_CODE' ? form.identifier : 'MANUAL', rfid: tenant.accessMethod === 'RFID' ? form.identifier : 'MANUAL', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), direction: form.direction, status: 'Liberado', manual: true }; addAccess(record); setOpen(false); setMessage(`${form.direction} de ${form.person} liberada manualmente.`); setForm({ person: '', identifier: '', direction: 'Entrada' }) }
  return <div className="admin-page"><PageHeader eyebrow="Portaria inteligente" title="Entradas e saídas" description={`Identificação principal: ${ACCESS_LABELS[tenant.accessMethod]}.`} action={<RoleGate roles={['operator', 'admin']}><Button onClick={() => setOpen(true)}><DoorOpen size={17} /> Liberação manual</Button></RoleGate>} />
    <VariationInfo>A coluna de identificação acompanha `accessMethod`: placa no LPR, código no QR Code e tag no RFID. A ação manual permanece reutilizável para perfis autorizados.</VariationInfo>
    {message && <Alert>{message}</Alert>}
    <div className="access-kpis"><Card><span><LogIn /></span><div><strong>284</strong><small>Entradas hoje</small></div></Card><Card><span><LogOut /></span><div><strong>231</strong><small>Saídas hoje</small></div></Card><Card><span><ShieldCheck /></span><div><strong>98,7%</strong><small>Liberações automáticas</small></div></Card></div>
    <Card><div className="table-toolbar"><div><h2>Fluxo recente</h2><p>{rows.length} acessos exibidos</p></div><StatusBadge tone="info">{identifierLabel}</StatusBadge></div><DataTable rows={rows} columns={columns} /></Card>
    {open && <div className="modal-backdrop"><form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="access-title"><button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fechar"><X size={18} /></button><p className="eyebrow">Ação de operador</p><h2 id="access-title">Liberação manual</h2><p>Registre uma exceção auditável para entrada ou saída.</p><div className="mt-6 space-y-4"><FormField label="Nome do usuário"><input required value={form.person} onChange={(event) => setForm({ ...form, person: event.target.value })} placeholder="Nome completo" /></FormField><FormField label={identifierLabel}><input required value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} placeholder="Informe a credencial" /></FormField><FormField label="Movimento"><select value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value as 'Entrada' | 'Saída' })}><option>Entrada</option><option>Saída</option></select></FormField></div><Button type="submit" className="mt-6 w-full justify-center">Confirmar liberação</Button></form></div>}
  </div>
}

export function ConfigurationPage() {
  const { tenant } = useTenant()
  return <div className="admin-page"><PageHeader eyebrow="Composição do produto" title="Módulos e personalização" description="Visualize como esta instância foi montada para o cliente ativo." />
    <VariationInfo>Esta tela torna a Linha de Produto visível: tema, método de acesso, perfis e módulos vêm do mesmo objeto `TenantConfig` consumido por menus e rotas.</VariationInfo>
    <div className="config-grid"><Card className="tenant-config-card"><div className="config-logo">{tenant.logo}</div><div><p className="eyebrow">Cliente ativo</p><h2>{tenant.name}</h2><p>{tenant.eyebrow}</p></div><div className="config-access"><ShieldCheck size={18} /><span>Método de acesso</span><strong>{ACCESS_LABELS[tenant.accessMethod]}</strong></div></Card><Card><div className="content-heading"><div><p className="eyebrow">White-label</p><h2>Tokens do tema</h2></div><Palette /></div><div className="theme-swatches">{Object.entries(tenant.theme).map(([name, color]) => <div key={name}><span style={{ background: color }} /><small>{name}</small><strong>{color}</strong></div>)}</div></Card></div>
    <div className="config-grid lower"><Card><div className="content-heading"><div><p className="eyebrow">Feature flags</p><h2>Módulos desta composição</h2></div></div><div className="feature-switches">{Object.entries(tenant.features).map(([feature, enabled]) => <div key={feature}><span><strong>{FEATURE_LABELS[feature as keyof typeof FEATURE_LABELS]}</strong><small>{enabled ? 'Disponível nesta variante' : 'Removido desta variante'}</small></span><span className={`readonly-switch ${enabled ? 'on' : ''}`} role="switch" aria-checked={enabled} aria-readonly="true"><i />{enabled ? 'ON' : 'OFF'}</span></div>)}</div></Card><Card><div className="content-heading"><div><p className="eyebrow">RBAC</p><h2>Perfis permitidos</h2></div></div><div className="allowed-roles">{tenant.allowedRoles.map((role) => <div key={role}><span><UserRound size={17} /></span><strong>{ROLE_LABELS[role]}</strong><BadgeCheck size={17} /></div>)}</div><Alert tone="warning"><strong>Configuração demonstrativa.</strong><br />Os controles são somente leitura para preservar a matriz acadêmica.</Alert></Card></div>
  </div>
}

const AGREEMENTS = [
  { number: 'ATD-48291', patient: 'Helena Moreira', agreement: 'Saúde Plena', benefit: 'Isenção de 100%' },
  { number: 'ATD-71305', patient: 'Roberto Alves', agreement: 'VidaCare', benefit: 'Desconto de 50%' },
  { number: 'ATD-10928', patient: 'Beatriz Souza', agreement: 'Bem Estar', benefit: '2 horas gratuitas' },
]

export function MedicalAgreementPage() {
  const { addMedicalValidation, state } = useTenant()
  const [attendance, setAttendance] = useState('')
  const [found, setFound] = useState<(typeof AGREEMENTS)[number] | null>(null)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const search = (event: FormEvent) => { event.preventDefault(); const result = AGREEMENTS.find((item) => item.number.toLowerCase() === attendance.trim().toLowerCase()); setFound(result ?? null); setConfirmed(false); setError(result ? '' : 'Atendimento não localizado. Tente ATD-48291.') }
  const confirm = () => { if (!found) return; const validation: MedicalValidation = { id: crypto.randomUUID(), attendanceNumber: found.number, patient: found.patient, agreement: found.agreement, benefit: found.benefit, createdAt: new Date().toISOString() }; addMedicalValidation(validation); setConfirmed(true) }
  return <div className="admin-page"><PageHeader eyebrow="Módulo exclusivo do Hospital" title="Convênio médico" description="Valide o benefício de estacionamento associado a um atendimento." action={<StatusBadge tone="success"><Stethoscope size={14} /> Hospital</StatusBadge>} />
    <VariationInfo>O módulo está separado do núcleo e só é ativado por `medicalAgreement`. Ainda assim, reutiliza layout, formulários, botões, cards, alertas, tema e autorização compartilhados.</VariationInfo>
    <div className="medical-steps">{['Atendimento', 'Localização', 'Elegibilidade', 'Benefício', 'Confirmação'].map((step, index) => <div key={step} className={(found && index < 4) || (confirmed && index === 4) ? 'done' : index === 0 && !found ? 'active' : ''}><span>{(found && index < 4) || (confirmed && index === 4) ? <Check size={14} /> : index + 1}</span><small>{step}</small></div>)}</div>
    <div className="medical-grid"><Card className="medical-search"><div className="medical-icon"><HeartHandshake size={28} /></div><p className="eyebrow">Etapa 1</p><h2>Localizar atendimento</h2><p>Informe o número recebido na recepção ou o código do convênio.</p><form onSubmit={search}><FormField label="Número do atendimento"><input required value={attendance} onChange={(event) => setAttendance(event.target.value)} placeholder="Ex.: ATD-48291" /></FormField><Button type="submit" className="w-full justify-center">Localizar atendimento <ArrowRight size={17} /></Button></form><small className="demo-hint">Para demonstrar, use <button onClick={() => setAttendance('ATD-48291')}>ATD-48291</button>.</small>{error && <Alert tone="danger">{error}</Alert>}</Card>
    <Card className={`eligibility-card ${found ? 'visible' : ''}`}>{found ? confirmed ? <div className="confirmation-state"><span><Check size={32} /></span><p className="eyebrow">Benefício aplicado</p><h2>Validação concluída</h2><p>O benefício <strong>{found.benefit}</strong> foi associado ao estacionamento de {found.patient}.</p><div className="receipt-code">VAL-{state.medicalValidations.length + 2840}</div><Button variant="secondary" onClick={() => { setAttendance(''); setFound(null); setConfirmed(false) }}>Nova validação</Button></div> : <><div className="eligibility-header"><span><BadgeCheck size={22} /></span><div><p className="eyebrow">Atendimento localizado</p><h2>Elegível para benefício</h2></div></div><div className="patient-card"><span><UserRound size={22} /></span><div><small>Paciente</small><strong>{found.patient}</strong><p>{found.number}</p></div></div><div className="eligibility-lines"><span>Convênio <strong>{found.agreement}</strong></span><span>Elegibilidade <StatusBadge tone="success">Ativa</StatusBadge></span><span>Benefício <strong>{found.benefit}</strong></span></div><Alert><strong>Elegibilidade validada.</strong><br />A regra mockada do convênio permite aplicar o benefício.</Alert><Button className="w-full justify-center" onClick={confirm}>Aplicar benefício <ArrowRight size={17} /></Button></> : <div className="medical-placeholder"><span><Stethoscope size={32} /></span><h2>Aguardando consulta</h2><p>Os dados do paciente, elegibilidade e benefício aparecerão aqui.</p></div>}</Card></div>
  </div>
}
