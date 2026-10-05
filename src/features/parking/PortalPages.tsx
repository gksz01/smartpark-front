import { ArrowLeft, ArrowRight, CalendarDays, Car, Check, Clock3, CreditCard, Edit3, KeyRound, MapPin, Navigation, QrCode, RotateCcw, Search, ShieldCheck, Sparkles, TicketCheck, Trash2, UserRoundCheck, WalletCards, XCircle, Zap } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTenant } from '../../core/app-context'
import { ACCESS_LABELS, PAYMENT_METHODS, TENANTS, PAYMENT_STATUS_LABELS, RESERVATION_STATUS_LABELS } from '../../core/config'
import { FeatureGate } from '../../core/gates'
import type { Agreement, AttendanceCheck, Parking, ParkingSpace, Payment, PaymentMethod, Reservation, Tariff, TenantId } from '../../core/types'
import { Convenio } from '../../domain/Convenio'
import { CRIAR_ESTRATEGIA_PAGAMENTO } from '../../domain/strategies/pagamento/estrategiaPorForma'
import { PagamentoCredito } from '../../domain/strategies/pagamento/PagamentoCredito'
import { TarifaComConvenio } from '../../domain/strategies/tarifa/TarifaComConvenio'
import { PARKINGS } from '../../data/mocks'
import { Reserva } from '../../domain/Reserva'
import { CRIAR_ESTRATEGIA } from '../../domain/strategies/tarifa/estrategiaPorTipo'
import { Tarifa } from '../../domain/Tarifa'
import { cancelReservation, createReservation, deleteReservation, listReservations, updateReservation } from '../../services/reservationsApi'
import { listAgreements, validateAttendance } from '../../services/agreementsApi'
import { createPayment, deletePayment, listPayments, refundPayment } from '../../services/paymentsApi'
import { listSpaces } from '../../services/spacesApi'
import { listTariffs } from '../../services/tariffsApi'
import { FormModal } from '../../shared/crud/FormModal'
import { RowActions } from '../../shared/crud/RowActions'
import { SelectField } from '../../shared/crud/SelectField'
import { useTenantData } from '../../shared/crud/useTenantData'
import { Alert, Button, Card, ConfirmDialog, DataTable, EmptyState, FormField, OccupancyBar, PageHeader, StatusBadge, VariationInfo, type Column } from '../../shared/ui'
import { formatarDataIso, formatarMoeda } from '../../domain/formatacao'

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

const DURATION_CHOICES = [1, 2, 4, 8].map((hours) => ({ value: String(hours), label: `${hours} ${hours === 1 ? 'hora' : 'horas'}` }))
const RESERVATION_TONE = { pendente: 'warning', confirmada: 'success', cancelada: 'neutral', concluida: 'info' } as const

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

const EMPTY_RESERVATION_DATA = { reservations: [] as Reservation[], freeSpaces: [] as ParkingSpace[], tarifa: null as Tarifa | null }

export function ReservationPage() {
  const { state, tenant } = useTenant()
  const navigate = useNavigate()
  // READ: reservas, vagas livres e tarifa ativa do tenant
  const { data, setData, error: loadError, reload } = useTenantData(loadReservationData, EMPTY_RESERVATION_DATA, 'Não foi possível carregar as reservas')
  const { reservations, freeSpaces, tarifa } = data
  const [saved, setSaved] = useState<Reservation | null>(null)
  const [form, setForm] = useState({ date: formatarDataIso(new Date()), time: '18:30', duration: '2', vehicleId: '', spaceId: '' })
  const [editing, setEditing] = useState<Reservation | null>(null)
  const [editForm, setEditForm] = useState({ date: '', time: '', duration: '2' })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Veículo e vaga escolhidos (ou o primeiro disponível)
  const vehicleId = form.vehicleId || state.vehicles[0]?.id || ''
  const spaceId = freeSpaces.some((space) => space.id === form.spaceId) ? form.spaceId : freeSpaces[0]?.id ?? ''
  const estimate = previewEstimate(tarifa, form.date, form.time, Number(form.duration))

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
      setData((current) => ({ ...current, reservations: current.reservations.filter((reservation) => reservation.id !== id) }))
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
    { header: 'Valor', render: (row) => formatarMoeda(row.estimate) },
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
      {(error || loadError) && !editing && <Alert tone="danger">{error || loadError}</Alert>}

      {saved ? (
        <Card className="success-panel">
          <span><TicketCheck size={30} /></span>
          <p className="eyebrow">Reserva confirmada</p>
          <h2>Sua vaga está garantida.</h2>
          <p>Chegue até 15 minutos após o horário reservado e acesse por {ACCESS_LABELS[tenant.accessMethod]}.</p>
          <div className="receipt-code">Reserva #{saved.id} · Vaga {saved.spaceCode} · {formatarMoeda(saved.estimate)}</div>
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
              <SelectField label="Período" value={form.duration} options={DURATION_CHOICES} onChange={(duration) => setForm({ ...form, duration })} />
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
              <strong>{estimate === null ? 'Sem tarifa ativa' : formatarMoeda(estimate)}</strong>
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
        <FormModal
          id="reservation-edit"
          eyebrow={`Vaga ${editing.spaceCode}`}
          title="Alterar reserva"
          error={error}
          submitLabel="Salvar alteração"
          cancelLabel="Fechar"
          onSubmit={submitEdit}
          onClose={() => setEditing(null)}
          extra={(
            <div className="estimate mt-5">
              <span>Nova estimativa</span>
              <strong>{editEstimate === null ? 'Sem tarifa ativa' : formatarMoeda(editEstimate)}</strong>
            </div>
          )}
        >
          <FormField label="Data">
            <input required type="date" value={editForm.date} onChange={(event) => setEditForm({ ...editForm, date: event.target.value })} />
          </FormField>
          <FormField label="Horário">
            <input required type="time" value={editForm.time} onChange={(event) => setEditForm({ ...editForm, time: event.target.value })} />
          </FormField>
          <SelectField label="Período" value={editForm.duration} options={DURATION_CHOICES} onChange={(duration) => setEditForm({ ...editForm, duration })} />
        </FormModal>
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

const PAYMENT_DURATIONS = [1, 2, 3, 4, 8].map((hours) => ({ value: String(hours), label: `${hours} ${hours === 1 ? 'hora' : 'horas'}` }))
const PAYMENT_TONE = { pendente: 'warning', aprovado: 'success', estornado: 'neutral' } as const
const INSTALLMENT_OPTIONS = Array.from({ length: PagamentoCredito.MAXIMO_PARCELAS }, (_, index) => ({ value: String(index + 1), label: `${index + 1}x` }))

/**
 * Prévia pelo mesmo caminho da API: Tarifa (Strategy) → [TarifaComConvenio] → Strategy de pagamento.
 * É só uma prévia: a API recalcula tudo antes de gravar.
 */
function previewPayment(tarifa: Tarifa | null, convenio: Convenio | null, duration: number, method: PaymentMethod, installments: number) {
  if (!tarifa) return null
  const tarifaAPagar = convenio ? new Tarifa(tarifa.id, tarifa.nome, new TarifaComConvenio(tarifa.estrategia, convenio)) : tarifa
  const amount = tarifaAPagar.calcular(duration)
  const resultado = CRIAR_ESTRATEGIA_PAGAMENTO[method](installments).processar(amount)
  return { tariffAmount: tarifa.calcular(duration), amount, charged: resultado.valorCobrado, detail: resultado.detalhe }
}

/** Histórico, tarifa ativa e (com medicalAgreement) convênios do tenant. */
async function loadPaymentData(tenantId: TenantId) {
  const withAgreements = TENANTS[tenantId].features.medicalAgreement
  const [payments, tariffs, agreements] = await Promise.all([
    listPayments(tenantId),
    listTariffs(tenantId).catch(() => [] as Tariff[]),
    withAgreements ? listAgreements(tenantId).catch(() => [] as Agreement[]) : Promise.resolve([] as Agreement[]),
  ])
  return { payments, tarifa: activeTarifa(tariffs), agreements }
}

const EMPTY_PAYMENT_DATA = { payments: [] as Payment[], tarifa: null as Tarifa | null, agreements: [] as Agreement[] }

export function PaymentsPage() {
  const { state, tenant } = useTenant()
  const withAgreements = tenant.features.medicalAgreement
  // READ: histórico, tarifa ativa e (com medicalAgreement) convênios
  const { data, setData, error: loadError, reload } = useTenantData(loadPaymentData, EMPTY_PAYMENT_DATA, 'Não foi possível carregar os pagamentos')
  const { payments, tarifa, agreements } = data
  const [form, setForm] = useState({ vehicleId: '', duration: '2', method: 'Pix' as PaymentMethod, installments: '1', attendanceNumber: '' })
  const [check, setCheck] = useState<AttendanceCheck | null>(null)
  const [receipt, setReceipt] = useState<Payment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const vehicleId = form.vehicleId || state.vehicles[0]?.id || ''
  const installments = form.method === 'Crédito' ? Number(form.installments) : 1
  // Convênio da prévia: só depois de verificar um atendimento elegível
  const agreement = check?.eligible ? agreements.find((item) => item.name === check.agreement) : undefined
  const convenio = agreement ? new Convenio(agreement.id, agreement.name, agreement.benefitType, agreement.benefitValue, agreement.active) : null
  const preview = previewPayment(tarifa, convenio, Number(form.duration), form.method, installments)

  // Verificar atendimento (Hospital): a API usa Atendimento.validarElegibilidade(), sem consumir o benefício
  const verify = async () => {
    setError('')
    try {
      setCheck(await validateAttendance(tenant.id, form.attendanceNumber))
    } catch (failure) {
      setCheck(null)
      setError((failure as Error).message)
    }
  }

  // CREATE: a API recalcula tudo, processa pela Strategy e consome o benefício na mesma transação
  const pay = async () => {
    setMessage('')
    setError('')
    try {
      const created = await createPayment(tenant.id, {
        vehicleId,
        duration: Number(form.duration),
        method: form.method,
        installments,
        attendanceNumber: withAgreements && form.attendanceNumber ? form.attendanceNumber : undefined,
      })
      setReceipt(created)
      setForm({ ...form, attendanceNumber: '' })
      setCheck(null)
      await reload()
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // UPDATE: estorno pelo domínio (pagamento.estornar())
  const refund = async (payment: Payment) => {
    setMessage('')
    setError('')
    try {
      await refundPayment(tenant.id, payment.id)
      setMessage(`Pagamento ${payment.receipt} estornado.`)
      await reload()
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  // DELETE: a API só aceita pagamentos estornados
  const confirmDelete = async (id: string) => {
    setDeleteId(null)
    setMessage('')
    try {
      await deletePayment(tenant.id, id)
      setData((current) => ({ ...current, payments: current.payments.filter((payment) => payment.id !== id) }))
      setMessage('Pagamento excluído.')
    } catch (failure) {
      setError((failure as Error).message)
    }
  }

  const columns: Column<Payment>[] = [
    { header: 'Comprovante', render: (row) => <div><strong>{row.receipt}</strong><small className="table-subtitle">{new Date(row.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small></div> },
    { header: 'Veículo', render: (row) => <div>{row.vehicleLabel}<small className="table-subtitle">{row.duration}h</small></div> },
    { header: 'Valor', render: (row) => <div>{formatarMoeda(row.amount)}{row.tariffAmount !== row.amount && <small className="table-subtitle">tarifa {formatarMoeda(row.tariffAmount)}</small>}</div> },
    { header: 'Cobrado', render: (row) => <strong>{formatarMoeda(row.chargedAmount)}</strong> },
    { header: 'Forma', render: (row) => row.installments > 1 ? `${row.method} · ${row.installments}x` : row.method },
    { header: 'Convênio', render: (row) => row.attendanceNumber ? <div>{row.agreementName}<small className="table-subtitle">{row.attendanceNumber}</small></div> : '—' },
    { header: 'Status', render: (row) => <StatusBadge tone={PAYMENT_TONE[row.status]}>{PAYMENT_STATUS_LABELS[row.status]}</StatusBadge> },
    {
      header: 'Ações',
      render: (row) => (
        <RowActions label={row.receipt} onDelete={() => setDeleteId(row.id)}>
          {row.status === 'aprovado' && <Button variant="secondary" onClick={() => refund(row)} aria-label={`Estornar ${row.receipt}`}><RotateCcw size={16} /> Estornar</Button>}
        </RowActions>
      ),
    },
  ]

  return (
    <div className="portal-content page-top narrow-page">
      <PageHeader eyebrow="Pagamento simulado" title="Finalizar estacionamento" description="Nenhum valor real será cobrado nesta demonstração." />
      <VariationInfo>
        Esta rota existe só com cobrança (`billing`). O valor vem da tarifa ativa (Strategy) e o processamento da Strategy de pagamento
        (Pix, Crédito ou Débito). Com `medicalAgreement` (Hospital), o Nº do atendimento aplica TarifaComConvenio e consome o benefício.
      </VariationInfo>
      {message && <Alert>{message}</Alert>}
      {(error || loadError) && <Alert tone="danger">{error || loadError}</Alert>}

      {receipt ? (
        <Card className="success-panel">
          <span><Check size={30} /></span>
          <p className="eyebrow">Pagamento aprovado</p>
          <h2>{formatarMoeda(receipt.chargedAmount)}</h2>
          <p>{receipt.detail}</p>
          <div className="receipt-lines">
            <span>Veículo <strong>{receipt.vehicleLabel}</strong></span>
            <span>Valor da tarifa <strong>{formatarMoeda(receipt.tariffAmount)}</strong></span>
            {receipt.attendanceNumber && <span>Convênio <strong>{receipt.agreementName} · {receipt.attendanceNumber}</strong></span>}
            <span>Forma <strong>{receipt.installments > 1 ? `${receipt.method} · ${receipt.installments}x` : receipt.method}</strong></span>
            <span>Comprovante <strong>{receipt.receipt}</strong></span>
            <span>Cliente <strong>{tenant.shortName}</strong></span>
          </div>
          <Button onClick={() => setReceipt(null)} variant="secondary">Novo pagamento</Button>
        </Card>
      ) : (
        <Card className="payment-panel">
          <div className="payment-summary">
            <span><WalletCards size={22} /></span>
            <div><p>Valor total</p><strong>{preview ? formatarMoeda(preview.charged) : 'Sem tarifa ativa'}</strong></div>
          </div>
          <div className="form-grid">
            <FormField label="Veículo">
              <select value={vehicleId} onChange={(event) => setForm({ ...form, vehicleId: event.target.value })}>
                {state.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.nickname} · {vehicle.plate}</option>)}
              </select>
            </FormField>
            <SelectField label="Duração" value={form.duration} options={PAYMENT_DURATIONS} onChange={(duration) => setForm({ ...form, duration })} />
          </div>
          <FeatureGate feature="medicalAgreement">
            <div className="mt-4 space-y-2">
              <FormField label="Nº do atendimento" hint="Opcional. Com convênio elegível, o benefício é aplicado e consumido neste pagamento.">
                <input value={form.attendanceNumber} onChange={(event) => { setForm({ ...form, attendanceNumber: event.target.value }); setCheck(null) }} placeholder="Ex.: ATD-48291" />
              </FormField>
              <Button type="button" variant="secondary" onClick={verify} disabled={!form.attendanceNumber.trim()}>Verificar atendimento</Button>
              {check && (check.eligible
                ? <Alert><strong>{check.agreement}</strong> · {check.benefit} para {check.patient}.</Alert>
                : <Alert tone="danger">{check.reason}</Alert>)}
            </div>
          </FeatureGate>
          <div className="receipt-lines">
            <span>Tarifa <strong>{tarifa ? tarifa.nome : 'Sem tarifa ativa'}</strong></span>
            {preview && <span>Valor da tarifa <strong>{formatarMoeda(preview.tariffAmount)}</strong></span>}
            {convenio && <span>Convênio <strong>{convenio.nome} · {convenio.descricaoBeneficio()}</strong></span>}
            {preview && <span>Valor a pagar <strong>{formatarMoeda(preview.amount)}</strong></span>}
            {preview && preview.charged !== preview.amount && <span>Com taxa do parcelamento <strong>{formatarMoeda(preview.charged)}</strong></span>}
          </div>
          <h3>Forma de pagamento</h3>
          <div className="payment-methods">
            {PAYMENT_METHODS.map((item) => (
              <button key={item} className={form.method === item ? 'active' : ''} onClick={() => setForm({ ...form, method: item })}>
                <span>{item === 'Pix' ? <Sparkles /> : <CreditCard />}</span>{item}{form.method === item && <Check size={15} />}
              </button>
            ))}
          </div>
          {form.method === 'Crédito' && (
            <SelectField label="Parcelas" value={form.installments} options={INSTALLMENT_OPTIONS} onChange={(installments) => setForm({ ...form, installments })} />
          )}
          {preview && <p className="mt-3 text-sm text-slate-500">{preview.detail}</p>}
          <Button className="mt-5 w-full justify-center" onClick={pay} disabled={!preview || !vehicleId}>
            Pagar {preview ? formatarMoeda(preview.charged) : ''} <ArrowRight size={17} />
          </Button>
        </Card>
      )}

      <section className="content-section">
        <Card>
          <div className="table-toolbar">
            <div>
              <h2>Histórico de pagamentos</h2>
              <p>{payments.length} pagamentos · estorne antes de excluir</p>
            </div>
          </div>
          <DataTable rows={payments} columns={columns} emptyMessage="Nenhum pagamento registrado." />
        </Card>
      </section>

      {deleteId && (
        <ConfirmDialog
          title="Excluir pagamento?"
          description="Somente pagamentos estornados podem ser excluídos."
          onCancel={() => setDeleteId(null)}
          onConfirm={() => confirmDelete(deleteId)}
        />
      )}
    </div>
  )
}
