import { ArrowLeft, ArrowRight, CalendarDays, Car, Check, Clock3, CreditCard, KeyRound, MapPin, Navigation, QrCode, Search, ShieldCheck, Sparkles, TicketCheck, UserRoundCheck, WalletCards, Zap } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTenant } from '../../core/app-context'
import { ACCESS_LABELS } from '../../core/config'
import type { Parking, Payment, Reservation } from '../../core/types'
import { PARKINGS } from '../../data/mocks'
import { Alert, Button, Card, EmptyState, FormField, OccupancyBar, PageHeader, StatusBadge, VariationInfo } from '../../shared/ui'

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
    tenant.features.reservation && { label: 'Reservar', icon: CalendarDays, to: '/app/reservations/new' },
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
    <Card className="access-callout"><div className="access-visual">{tenant.accessMethod === 'QR_CODE' ? <QrCode /> : tenant.accessMethod === 'RFID' ? <Zap /> : <Car />}</div><div><p className="eyebrow">Entrada configurada</p><h2>{ACCESS_LABELS[tenant.accessMethod]}</h2><p>Ao chegar, siga a sinalização. A validação é simulada automaticamente neste protótipo.</p></div>{tenant.features.reservation && <Link className="button button-primary" to="/app/reservations/new">Reservar vaga <ArrowRight size={16} /></Link>}</Card>
  </div>
}

export function ReservationPage() {
  const { state, tenant, addReservation } = useTenant()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ date: '2026-09-05', time: '18:30', duration: '2', vehicleId: state.vehicles[0]?.id ?? '' })
  const estimate = Number(form.duration) * PARKINGS[0].pricePerHour
  const submit = (event: FormEvent) => { event.preventDefault(); const reservation: Reservation = { id: crypto.randomUUID(), parkingId: PARKINGS[0].id, date: form.date, time: form.time, duration: Number(form.duration), vehicleId: form.vehicleId, estimate, status: 'confirmed' }; addReservation(reservation); setSaved(true) }
  return <div className="portal-content page-top narrow-page"><PageHeader eyebrow="Reserva antecipada" title="Garanta sua vaga" description={`Reserve no ${PARKINGS[0].name} em poucos passos.`} />
    <VariationInfo>Esta rota e sua entrada no menu só existem quando `reservation=true`. Formulários, veículo e estimativa reutilizam dados e componentes do núcleo.</VariationInfo>
    {saved ? <Card className="success-panel"><span><TicketCheck size={30} /></span><p className="eyebrow">Reserva confirmada</p><h2>Sua vaga está garantida.</h2><p>Chegue até 15 minutos após o horário reservado e acesse por {ACCESS_LABELS[tenant.accessMethod]}.</p><div className="receipt-code">Reserva #{state.reservations.length + 2481}</div><Button onClick={() => navigate('/app/home')}>Voltar ao início</Button></Card> : <form onSubmit={submit}><Card className="form-card"><div className="form-card-title"><MapPin size={20} /><div><strong>{PARKINGS[0].name}</strong><p>{PARKINGS[0].address}</p></div></div><div className="form-grid"><FormField label="Data"><input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></FormField><FormField label="Horário"><input required type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></FormField><FormField label="Período"><select value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })}><option value="1">1 hora</option><option value="2">2 horas</option><option value="4">4 horas</option><option value="8">8 horas</option></select></FormField><FormField label="Veículo"><select required value={form.vehicleId} onChange={(event) => setForm({ ...form, vehicleId: event.target.value })}>{state.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.nickname} · {vehicle.plate}</option>)}</select></FormField></div><div className="estimate"><span>Estimativa da reserva</span><strong>R$ {estimate.toFixed(2).replace('.', ',')}</strong></div><Button className="w-full justify-center" type="submit" disabled={!state.vehicles.length}>Confirmar reserva <ArrowRight size={17} /></Button></Card></form>}
  </div>
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
