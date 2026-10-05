import { ArrowLeft, ArrowRight, CalendarDays, Car, Check, Clock3, CreditCard, Edit3, KeyRound, MapPin, Navigation, QrCode, Search, ShieldCheck, Sparkles, TicketCheck, Trash2, UserRoundCheck, WalletCards, X, XCircle, Zap } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTenant } from '../../core/app-context'
import { ACCESS_LABELS, RESERVATION_STATUS_LABELS } from '../../core/config'
import type { Parking, ParkingSpace, Payment, Reservation, Tariff, TenantId } from '../../core/types'
import { PARKINGS } from '../../data/mocks'
import { Reserva } from '../../domain/Reserva'
import { CRIAR_ESTRATEGIA } from '../../domain/strategies/tarifa/estrategiaPorTipo'
import { Tarifa } from '../../domain/Tarifa'
import { cancelReservation, createReservation, deleteReservation, listReservations, updateReservation } from '../../services/reservationsApi'
import { listSpaces } from '../../services/spacesApi'
import { listTariffs } from '../../services/tariffsApi'
import { Alert, Button, Card, ConfirmDialog, DataTable, EmptyState, FormField, OccupancyBar, PageHeader, StatusBadge, VariationInfo, type Column } from '../../shared/ui'

function ParkingCard({ parking }: { parking: Parking }) {
  const { tenant } = useTenant()
  const used = parking.total - parking.available
  return <Card className="parking-card"><div className="parking-card-top"><span className="parking-pin"><MapPin size={20} /></span><div><h3>{parking.name}</h3><p>{parking.address}</p></div><StatusBadge tone="info">{parking.distance}</StatusBadge></div><div className="my-4"><OccupancyBar used={used} total={parking.total} /></div><div className="parking-meta"><span><strong>{parking.available}</strong> vagas</span>{tenant.features.billing && <span><strong>R$ {parking.pricePerHour}</strong>/hora</span>}<span>{parking.open24h ? '24 horas' : 'Até 23h'}</span></div><div className="mt-5 flex items-center justify-between"><div className="flex flex-wrap gap-1.5">{parking.services.slice(0, 2).map((service) => <StatusBadge key={service}>{service}</StatusBadge>)}</div><Link className="round-link" to={`/app/parking/${parking.id}`} aria-label={`Ver ${parking.name}`}><ArrowRight size={18} /></Link></div></Card>
}

export function HomePage() {
  const { tenant, state } = useTenant()
  const [feedback, setFeedback] = useState('')
  const vehicle = state.vehicles[0]
  const active = PARKINGS[0]
  const quickActions = [
    tenant.features.reservation && { label: 'Reservar', icon: CalendarDays, to: '/app/reservations' },
    tenant.features.payments && { label: 'Pagar', icon: CreditCard, to: '/app/payments' },
    tenant.features.visitorManagement && { label: 'Autorizar visita', icon: UserRoundCheck, action: 'Convite de visitante gerado com sucesso.' },
    tenant.features.valet && { label: 'Manobrista', icon: KeyRound, action: 'Manobrista solicitado. Previsão: 8 minutos.' },
    { label: ACCESS_LABELS[tenant.accessMethod].replace('Leitura de placa ', '').replace(/[()]/g, ''), icon: tenant.accessMethod === 'QR_CODE' ? QrCode : ShieldCheck, action: `Credencial ${ACCESS_LABELS[tenant.accessMethod]} pronta para uso.` },
  ].filter(Boolean) as { label: string; icon: typeof CalendarDays; to?: string; action?: string }[]

  return <><section className="home-hero"><div className="home-hero-glow" /><p>{tenant.eyebrow}</p><h1>Olá! <span>👋</span></h1><h2>{tenant.welcome}</h2><div className="hero-search"><Search size={19} /><Link to="/app/parking">Onde você quer estacionar?</Link><button aria-label="Usar localização"><Navigation size={17} /></button></div></section><div className="portal-content">
    <VariationInfo>A home usa o mesmo layout e monta ações por feature. Reserva, pagamento, visitantes e manobrista aparecem apenas quando habilitados para {tenant.shortName}.</VariationInfo>
    {feedback && <Alert>{feedback}</Alert>}
    <section className="content-section"><div className="content-heading"><div><p className="eyebrow">Agora</p><h2>Estacionamento ativo</h2></div><StatusBadge tone="success">Em andamento</StatusBadge></div><Card className="active-parking"><div className="active-line"><span className="parking-pin"><MapPin size={20} /></span><div><strong>{active.name}</strong><p>Entrada hoje às 13:42</p></div><span className="active-time">01:24</span></div><div className="active-details"><span><small>Veículo</small><strong>{vehicle?.plate ?? 'Sem veículo'}</strong></span><span><small>Acesso</small><strong>{ACCESS_LABELS[tenant.accessMethod]}</strong></span>{tenant.features.billing && <span><small>Parcial</small><strong>R$ 18,00</strong></span>}</div></Card></section>
    <section className="content-section"><div className="content-heading"><h2>Ações rápidas</h2></div><div className="quick-grid">{quickActions.map(({ label, icon: Icon, to, action }) => to ? <Link key={label} to={to}><span><Icon size={20} /></span>{label}</Link> : <button key={label} onClick={() => setFeedback(action ?? '')}><span><Icon size={20} /></span>{label}</button>)}</div></section>
    <section className="content-section"><div className="content-heading"><h2>Próximos de você</h2><Link to="/app/parking">Ver todos</Link></div><div className="cards-horizontal">{PARKINGS.slice(0, 2).map((parking) => <ParkingCard key={parking.id} parking={parking} />)}</div></section>
    <section className="content-section split-section"><div><div className="content-heading"><h2>Seus veículos</h2><Link to="/app/vehicles">Gerenciar</Link></div><Card className="compact-row"><span className="car-avatar"><Car /></span><div><strong>{vehicle?.nickname ?? 'Cadastre um veículo'}</strong><p>{vehicle ? `${vehicle.model} · ${vehicle.plate}` : 'Nenhum veículo cadastrado'}</p></div></Card></div><div><div className="content-heading"><h2>Histórico recente</h2></div><Card className="history-list"><div><span className="history-icon"><Check size={16} /></span><div><strong>Entrada liberada</strong><p>Hoje, 13:42 · {ACCESS_LABELS[tenant.accessMethod]}</p></div></div><div><span className="history-icon muted"><Clock3 size={16} /></span><div><strong>Estacionamento finalizado</strong><p>Ontem, 18:12 · 2h14min</p></div></div></Card></div></section>
  </div></>
}

export function ParkingSearchPage() {
  const { tenant } = useTenant()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<string[]>([])
  const availableFilters = [tenant.features.reservation && 'Aceita reserva', '24 horas', tenant.features.valet && 'Manobrista', tenant.features.billing && 'Até R$ 12/h', tenant.features.visitorManagement && 'Acesso restrito'].filter(Boolean) as string[]
  const results = PARKINGS.filter((parking) => parking.name.toLowerCase().includes(query.toLowerCase()) || parking.address.toLowerCase().includes(query.toLowerCase()))
  const toggle = (filter: string) => setFilters((current) => current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter])
  return <div className="portal-content page-top"><PageHeader eyebrow="Encontre sua vaga" title="Estacionamentos próximos" description="Compare ocupação, serviços e formas de acesso em tempo real." />
    <VariationInfo>Os filtros são compostos pelas features ativas: preço depende de cobrança, enquanto reserva e manobrista só existem nas configurações que oferecem esses módulos.</VariationInfo>
    <div className="search-box"><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou endereço" /></div><div className="filter-row">{availableFilters.map((filter) => <button key={filter} className={filters.includes(filter) ? 'active' : ''} onClick={() => toggle(filter)}>{filter}{filters.includes(filter) && <Check size={14} />}</button>)}</div>
    <div className="search-layout"><div className="space-y-4"><div className="result-count"><strong>{results.length} opções encontradas</strong><span>Ordenado por distância</span></div>{results.length ? results.map((parking) => <ParkingCard key={parking.id} parking={parking} />) : <EmptyState title="Nenhum estacionamento encontrado" description="Tente buscar por outro nome ou endereço." />}</div><Card className="map-mock"><div className="map-road road-one" /><div className="map-road road-two" /><div className="map-road road-three" />{PARKINGS.map((parking, index) => <Link key={parking.id} to={`/app/parking/${parking.id}`} className={`map-marker marker-${index + 1}`}><MapPin size={18} /><span>{parking.available}</span></Link>)}<div className="map-label"><Navigation size={14} /> Mapa demonstrativo</div></Card></div>
  </div>
}

export function ParkingDetailPage() {
  const { id } = useParams()
  const { tenant } = useTenant()
  const parking = PARKINGS.find((item) => item.id === id)
  if (!parking) return <div className="portal-content page-top"><EmptyState title="Estacionamento não encontrado" description="Volte à busca e escolha uma opção disponível." /></div>
  return <div className="portal-content page-top"><Link className="back-link" to="/app/parking"><ArrowLeft size={16} /> Voltar para busca</Link><div className="detail-hero"><div><StatusBadge tone="success">Aberto agora</StatusBadge><h1>{parking.name}</h1><p><MapPin size={16} /> {parking.address} · {parking.distance}</p></div><div className="detail-number"><strong>{parking.available}</strong><span>vagas livres</span></div></div>
    <VariationInfo>Preço, botão de reserva e serviço de manobrista são gates independentes. O método de entrada vem da configuração do cliente, sem duplicar esta página.</VariationInfo>
    <div className="detail-grid"><Card><h2>Ocupação agora</h2><div className="occupancy-big"><strong>{parking.total - parking.available}</strong><span>de {parking.total} vagas ocupadas</span></div><OccupancyBar used={parking.total - parking.available} total={parking.total} /><div className="detail-stat-row"><span><small>Horário</small><strong>{parking.open24h ? 'Aberto 24h' : '06h às 23h'}</strong></span>{tenant.features.billing && <span><small>Tarifa</small><strong>R$ {parking.pricePerHour},00/h</strong></span>}<span><small>Acesso</small><strong>{ACCESS_LABELS[tenant.accessMethod]}</strong></span></div></Card><Card><h2>Serviços disponíveis</h2><div className="service-list">{parking.services.filter((service) => service !== 'Manobrista' || tenant.features.valet).map((service) => <div key={service}><span><Check size={15} /></span>{service}</div>)}{tenant.features.valet && !parking.services.includes('Manobrista') && <div><span><Check size={15} /></span>Manobrista</div>}</div></Card></div>
    <Card className="access-callout"><div className="access-visual">{tenant.accessMethod === 'QR_CODE' ? <QrCode /> : tenant.accessMethod === 'RFID' ? <Zap /> : <Car />}</div><div><p className="eyebrow">Entrada configurada</p><h2>{ACCESS_LABELS[tenant.accessMethod]}</h2><p>Ao chegar, siga a sinalização. A validação é simulada automaticamente neste protótipo.</p></div>{tenant.features.reservation && <Link className="button button-primary" to="/app/reservations">Reservar vaga <ArrowRight size={16} /></Link>}</Card>
  </div>
}

const DURATION_OPTIONS = [1, 2, 4, 8]
const RESERVATION_TONE = { pendente: 'warning', confirmada: 'success', cancelada: 'neutral', concluida: 'info' } as const

function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** Tarifa ativa → Tarifa (Context) com a Strategy gravada no banco. */
function activeTarifa(tariffs: Tariff[]): Tarifa | null {
  const row = tariffs.find((tariff) => tariff.active)
  if (!row) return null
  return new Tarifa(row.id, row.name, CRIAR_ESTRATEGIA[row.strategy]({ tipo: row.strategy, valor: row.value, valorMaximoDiario: row.maxDaily }))
}

/** Prévia da estimativa pelo mesmo caminho da API: Reserva → Tarifa → Strategy (sem fórmula no React). */
function previewEstimate(tarifa: Tarifa | null, date: string, time: string, duration: number): number | null {
  if (!tarifa) return null
  return new Reserva('', '', '', date, time, duration).calcularEstimativa(tarifa)
}

/** Reservas, vagas livres e tarifa ativa do tenant, vindas da API. */
async function loadReservationData(tenantId: TenantId) {
  const [reservations, spaces, tariffs] = await Promise.all([
    listReservations(tenantId),
    listSpaces(tenantId),
    listTariffs(tenantId).catch(() => [] as Tariff[]), // sem tarifa ativa, a API recusa a reserva
  ])
  return { reservations, freeSpaces: spaces.filter((space) => space.status === 'Livre'), tarifa: activeTarifa(tariffs) }
}

export function ReservationPage() {
  const { state, tenant, dataVersion } = useTenant()
  const navigate = useNavigate()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [freeSpaces, setFreeSpaces] = useState<ParkingSpace[]>([])
  const [tarifa, setTarifa] = useState<Tarifa | null>(null)
  const [saved, setSaved] = useState<Reservation | null>(null)
  const [form, setForm] = useState({ date: todayIso(), time: '18:30', duration: '2', vehicleId: '', spaceId: '' })
  const [editing, setEditing] = useState<Reservation | null>(null)
  const [editForm, setEditForm] = useState({ date: '', time: '', duration: '2' })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Veículo e vaga escolhidos (ou o primeiro disponível)
  const vehicleId = form.vehicleId || state.vehicles[0]?.id || ''
  const spaceId = freeSpaces.some((space) => space.id === form.spaceId) ? form.spaceId : freeSpaces[0]?.id ?? ''
  const estimate = previewEstimate(tarifa, form.date, form.time, Number(form.duration))

  // READ: carrega reservas, vagas livres e tarifa ativa do tenant
  useEffect(() => {
    let current = true
    loadReservationData(tenant.id)
      .then((data) => {
        if (!current) return
        setReservations(data.reservations)
        setFreeSpaces(data.freeSpaces)
        setTarifa(data.tarifa)
        setError('')
      })
      .catch((failure: Error) => {
        if (!current) return
        setReservations([])
        setError(`Não foi possível carregar as reservas: ${failure.message}`)
      })
    return () => { current = false }
  }, [tenant.id, dataVersion])

  const reload = async () => {
    const data = await loadReservationData(tenant.id)
    setReservations(data.reservations)
    setFreeSpaces(data.freeSpaces)
    setTarifa(data.tarifa)
  }

  // CREATE: a API calcula com a Strategy e confirma pelo Observer (vaga → Reservada)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      const result = await createReservation(tenant.id, { vehicleId, spaceId, date: form.date, time: form.time, duration: Number(form.duration) })
      setSaved(result.reservation)
      setMessage(result.notifications.join(' ') || 'Reserva confirmada.')
      await reload()
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  const openEdit = (reservation: Reservation) => {
    setEditing(reservation)
    setEditForm({ date: reservation.date, time: reservation.time, duration: String(reservation.duration) })
    setMessage('')
    setError('')
  }

  // UPDATE: data, horário e duração; a API recalcula a estimativa
  const submitEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing) return
    try {
      const result = await updateReservation(tenant.id, editing.id, { date: editForm.date, time: editForm.time, duration: Number(editForm.duration) })
      setEditing(null)
      setMessage(result.notifications.join(' ') || 'Reserva alterada.')
      await reload()
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // UPDATE (status): cancelar libera a vaga pelo Observer
  const cancel = async (reservation: Reservation) => {
    setMessage('')
    setError('')
    try {
      const result = await cancelReservation(tenant.id, reservation.id)
      setMessage(result.notifications.join(' ') || 'Reserva cancelada.')
      await reload()
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // DELETE: a API só aceita reservas canceladas ou concluídas
  const confirmDelete = async (id: string) => {
    setDeleteId(null)
    setMessage('')
    try {
      await deleteReservation(tenant.id, id)
      setReservations((current) => current.filter((reservation) => reservation.id !== id))
      setMessage('Reserva excluída.')
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  const isActive = (reservation: Reservation) => reservation.status === 'pendente' || reservation.status === 'confirmada'

  const columns: Column<Reservation>[] = [
    { header: 'Veículo', render: (row) => row.vehicleLabel },
    { header: 'Vaga', render: (row) => <strong>{row.spaceCode}</strong> },
    { header: 'Data', render: (row) => row.date.split('-').reverse().join('/') },
    { header: 'Horário', render: (row) => row.time },
    { header: 'Duração', render: (row) => `${row.duration}h` },
    { header: 'Valor', render: (row) => `R$ ${row.estimate.toFixed(2).replace('.', ',')}` },
    { header: 'Status', render: (row) => <StatusBadge tone={RESERVATION_TONE[row.status]}>{RESERVATION_STATUS_LABELS[row.status]}</StatusBadge> },
    {
      header: 'Ações',
      render: (row) => (
        <div className="flex gap-2">
          {isActive(row) && <Button variant="secondary" onClick={() => openEdit(row)} aria-label={`Editar reserva da vaga ${row.spaceCode}`}><Edit3 size={16} /> Editar</Button>}
          {isActive(row) && <Button variant="secondary" onClick={() => cancel(row)} aria-label={`Cancelar reserva da vaga ${row.spaceCode}`}><XCircle size={16} /> Cancelar</Button>}
          <Button variant="ghost" onClick={() => setDeleteId(row.id)} aria-label={`Excluir reserva da vaga ${row.spaceCode}`}><Trash2 size={16} /> Excluir</Button>
        </div>
      ),
    },
  ]

  const editEstimate = previewEstimate(tarifa, editForm.date, editForm.time, Number(editForm.duration))

  return (
    <div className="portal-content page-top narrow-page">
      <PageHeader eyebrow="Reserva antecipada" title="Garanta sua vaga" description={`Reserve no ${PARKINGS[0].name} em poucos passos.`} />
      <VariationInfo>
        Esta rota e sua entrada no menu só existem quando `reservation=true`. A estimativa usa a tarifa ativa (Strategy) e a confirmação
        passa pelo Observer EventosReserva, que reserva a vaga e gera a notificação.
      </VariationInfo>
      {message && <Alert>{message}</Alert>}
      {error && !editing && <Alert tone="danger">{error}</Alert>}

      {saved ? (
        <Card className="success-panel">
          <span><TicketCheck size={30} /></span>
          <p className="eyebrow">Reserva confirmada</p>
          <h2>Sua vaga está garantida.</h2>
          <p>Chegue até 15 minutos após o horário reservado e acesse por {ACCESS_LABELS[tenant.accessMethod]}.</p>
          <div className="receipt-code">Reserva #{saved.id} · Vaga {saved.spaceCode} · R$ {saved.estimate.toFixed(2).replace('.', ',')}</div>
          <div className="flex justify-center gap-2">
            <Button variant="secondary" onClick={() => setSaved(null)}>Nova reserva</Button>
            <Button onClick={() => navigate('/app/home')}>Voltar ao início</Button>
          </div>
        </Card>
      ) : (
        <form onSubmit={submit}>
          <Card className="form-card">
            <div className="form-card-title"><MapPin size={20} /><div><strong>{PARKINGS[0].name}</strong><p>{PARKINGS[0].address}</p></div></div>
            <div className="form-grid">
              <FormField label="Data">
                <input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </FormField>
              <FormField label="Horário">
                <input required type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
              </FormField>
              <FormField label="Período">
                <select value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })}>
                  {DURATION_OPTIONS.map((hours) => <option key={hours} value={hours}>{hours} {hours === 1 ? 'hora' : 'horas'}</option>)}
                </select>
              </FormField>
              <FormField label="Veículo">
                <select required value={vehicleId} onChange={(event) => setForm({ ...form, vehicleId: event.target.value })}>
                  {state.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.nickname} · {vehicle.plate}</option>)}
                </select>
              </FormField>
              <FormField label="Vaga">
                <select required value={spaceId} onChange={(event) => setForm({ ...form, spaceId: event.target.value })}>
                  {freeSpaces.map((space) => <option key={space.id} value={space.id}>{space.code} · {space.type}</option>)}
                </select>
              </FormField>
            </div>
            <div className="estimate">
              <span>Estimativa da reserva{tarifa ? ` · ${tarifa.nome}` : ''}</span>
              <strong>{estimate === null ? 'Sem tarifa ativa' : `R$ ${estimate.toFixed(2).replace('.', ',')}`}</strong>
            </div>
            <Button className="w-full justify-center" type="submit" disabled={!state.vehicles.length || !freeSpaces.length}>Confirmar reserva <ArrowRight size={17} /></Button>
          </Card>
        </form>
      )}

      <section className="content-section">
        <Card>
          <div className="table-toolbar">
            <div>
              <h2>Minhas reservas</h2>
              <p>{reservations.length} reservas · {freeSpaces.length} vagas livres</p>
            </div>
          </div>
          <DataTable rows={reservations} columns={columns} emptyMessage="Nenhuma reserva registrada." />
        </Card>
      </section>

      {editing && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={submitEdit} role="dialog" aria-modal="true" aria-labelledby="reservation-edit-title">
            <button type="button" className="modal-close" onClick={() => setEditing(null)} aria-label="Fechar"><X size={18} /></button>
            <p className="eyebrow">Vaga {editing.spaceCode}</p>
            <h2 id="reservation-edit-title">Alterar reserva</h2>
            <div className="mt-6 space-y-4">
              <FormField label="Data">
                <input required type="date" value={editForm.date} onChange={(event) => setEditForm({ ...editForm, date: event.target.value })} />
              </FormField>
              <FormField label="Horário">
                <input required type="time" value={editForm.time} onChange={(event) => setEditForm({ ...editForm, time: event.target.value })} />
              </FormField>
              <FormField label="Período">
                <select value={editForm.duration} onChange={(event) => setEditForm({ ...editForm, duration: event.target.value })}>
                  {DURATION_OPTIONS.map((hours) => <option key={hours} value={hours}>{hours} {hours === 1 ? 'hora' : 'horas'}</option>)}
                </select>
              </FormField>
            </div>
            <div className="estimate mt-5">
              <span>Nova estimativa</span>
              <strong>{editEstimate === null ? 'Sem tarifa ativa' : `R$ ${editEstimate.toFixed(2).replace('.', ',')}`}</strong>
            </div>
            {error && <div className="mt-5"><Alert tone="danger">{error}</Alert></div>}
            <div className="mt-7 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Fechar</Button>
              <Button type="submit">Salvar alteração</Button>
            </div>
          </form>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Excluir reserva?"
          description="Somente reservas canceladas ou concluídas podem ser excluídas."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => confirmDelete(deleteId)}
        />
      )}
    </div>
  )
}

export function PaymentsPage() {
  const { state, tenant, addPayment } = useTenant()
  const [method, setMethod] = useState('Pix')
  const [receipt, setReceipt] = useState<Payment | null>(null)
  const amount = 28
  const pay = () => { const next: Payment = { id: crypto.randomUUID(), vehicleId: state.vehicles[0]?.id ?? '', period: 'Hoje · 13:42 — 16:02', amount, method, createdAt: new Date().toISOString(), receipt: `SPK-${Math.floor(100000 + Math.random() * 900000)}` }; addPayment(next); setReceipt(next) }
  return <div className="portal-content page-top narrow-page"><PageHeader eyebrow="Pagamento mockado" title="Finalizar estacionamento" description="Nenhum valor real será cobrado nesta demonstração." />
    <VariationInfo>Pagamento e cobrança são gates separados e ambos protegem esta rota. O comprovante reutiliza veículo e período do núcleo, sem gateway externo.</VariationInfo>
    {receipt ? <Card className="success-panel"><span><Check size={30} /></span><p className="eyebrow">Pagamento aprovado</p><h2>R$ {receipt.amount.toFixed(2).replace('.', ',')}</h2><p>{receipt.period}</p><div className="receipt-lines"><span>Veículo <strong>{state.vehicles[0]?.plate}</strong></span><span>Forma <strong>{receipt.method}</strong></span><span>Comprovante <strong>{receipt.receipt}</strong></span><span>Cliente <strong>{tenant.shortName}</strong></span></div><Button onClick={() => setReceipt(null)} variant="secondary">Novo pagamento</Button></Card> : <Card className="payment-panel"><div className="payment-summary"><span><WalletCards size={22} /></span><div><p>Valor total</p><strong>R$ 28,00</strong></div></div><div className="receipt-lines"><span>Período <strong>Hoje · 13:42 — 16:02</strong></span><span>Veículo <strong>{state.vehicles[0]?.plate ?? 'Não cadastrado'}</strong></span><span>Duração <strong>2h20min</strong></span></div><h3>Forma de pagamento</h3><div className="payment-methods">{['Pix', 'Crédito', 'Débito'].map((item) => <button key={item} className={method === item ? 'active' : ''} onClick={() => setMethod(item)}><span>{item === 'Pix' ? <Sparkles /> : <CreditCard />}</span>{item}{method === item && <Check size={15} />}</button>)}</div><Button className="w-full justify-center" onClick={pay}>Pagar R$ 28,00 <ArrowRight size={17} /></Button></Card>}
  </div>
}
