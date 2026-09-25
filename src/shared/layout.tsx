import { Activity, Car, CircleParking, CreditCard, FileCog, HeartHandshake, LayoutDashboard, LogOut, Menu, RotateCcw, Search, Settings2, TicketCheck, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTenant } from '../core/app-context'
import { hasPermission, ROLE_LABELS } from '../core/config'
import type { Feature, Permission } from '../core/types'
import { Brand } from './ui'

interface NavigationItem { to: string; label: string; icon: typeof Search; feature?: Feature; permission?: Permission }

const portalNav: NavigationItem[] = [
  { to: '/app/home', label: 'Início', icon: CircleParking, permission: 'portal' },
  { to: '/app/parking', label: 'Buscar', icon: Search, permission: 'portal' },
  { to: '/app/vehicles', label: 'Veículos', icon: Car, permission: 'vehicles' },
  { to: '/app/reservations/new', label: 'Reservar', icon: TicketCheck, feature: 'reservation', permission: 'portal' },
  { to: '/app/payments', label: 'Pagar', icon: CreditCard, feature: 'payments', permission: 'portal' },
]

const adminNav: NavigationItem[] = [
  { to: '/admin/dashboard', label: 'Visão geral', icon: LayoutDashboard, permission: 'dashboard' },
  { to: '/app/vehicles', label: 'Veículos', icon: Car, permission: 'vehicles' },
  { to: '/admin/spaces', label: 'Vagas e setores', icon: CircleParking, permission: 'spaces' },
  { to: '/admin/access', label: 'Entradas e saídas', icon: Activity, permission: 'access' },
  { to: '/admin/configuration', label: 'Configuração', icon: FileCog, permission: 'configuration' },
  { to: '/admin/medical-agreement', label: 'Convênios', icon: HeartHandshake, feature: 'medicalAgreement', permission: 'medicalAgreement' },
]

function availableNavigation(items: NavigationItem[], tenant: ReturnType<typeof useTenant>['tenant'], role: ReturnType<typeof useTenant>['state']['role']) {
  return items.filter((item) => (!item.feature || tenant.features[item.feature]) && (!item.permission || hasPermission(role, item.permission)))
}

function DemoToolbar() {
  const { state, tenant, setAcademicMode, resetDemo } = useTenant()
  return (
    <div className="demo-toolbar">
      <div className="min-w-0"><span className="demo-dot" /><strong>{tenant.shortName}</strong><span className="hidden sm:inline"> · {ROLE_LABELS[state.role]}</span></div>
      <label className="academic-toggle"><input type="checkbox" checked={state.academicMode} onChange={(event) => setAcademicMode(event.target.checked)} /><span /><em>Modo acadêmico</em></label>
      <button onClick={resetDemo} title="Restaurar dados da demonstração" aria-label="Restaurar dados da demonstração"><RotateCcw size={15} /></button>
      <Link to="/" title="Trocar cliente ou perfil" aria-label="Trocar cliente ou perfil"><Settings2 size={16} /></Link>
    </div>
  )
}

export function PortalLayout({ children }: { children: ReactNode }) {
  const { tenant, state } = useTenant()
  const items = availableNavigation(portalNav, tenant, state.role)
  return (
    <div className="portal-shell">
      <DemoToolbar />
      <header className="portal-header"><Brand /><Link className="header-exit" to="/"><LogOut size={17} /> <span>Trocar perfil</span></Link></header>
      <main className="portal-main">{children}</main>
      <nav className="bottom-nav" aria-label="Navegação principal">{items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={20} /><span>{label}</span></NavLink>)}</nav>
    </div>
  )
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { tenant, state } = useTenant()
  const [open, setOpen] = useState(false)
  const items = availableNavigation(adminNav, tenant, state.role)
  return (
    <div className="admin-shell">
      <DemoToolbar />
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="flex items-center justify-between"><Brand /><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button></div>
        <nav aria-label="Navegação administrativa">{items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={19} />{label}</NavLink>)}</nav>
        <div className="sidebar-profile"><div className="avatar">{ROLE_LABELS[state.role].slice(0, 2).toUpperCase()}</div><div><strong>{ROLE_LABELS[state.role]}</strong><span>{tenant.shortName}</span></div></div>
        <Link className="sidebar-switch" to="/"><Settings2 size={17} /> Trocar contexto</Link>
      </aside>
      {open && <button className="sidebar-overlay" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
      <div className="admin-content">
        <header className="admin-mobile-header"><button onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button><Brand compact /><span /></header>
        <main>{children}</main>
      </div>
    </div>
  )
}
