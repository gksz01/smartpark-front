import { AlertTriangle, ArrowRight, Check, Info, X } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTenant } from '../core/app-context'

export function Brand({ compact = false }: { compact?: boolean }) {
  const { tenant } = useTenant()
  return (
    <div className="flex items-center gap-3">
      <span className="brand-mark" aria-hidden="true">{tenant.logo}</span>
      {!compact && <div><strong className="block leading-tight">{tenant.shortName}</strong><span className="text-xs text-slate-500">powered by SmartPark</span></div>}
    </div>
  )
}

export function Button({ className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={`button button-${variant} ${className}`} {...props} />
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}

export function VariationInfo({ children }: { children: ReactNode }) {
  const { state } = useTenant()
  if (!state.academicMode) return null
  return (
    <aside className="variation-info">
      <div className="variation-icon"><Info size={18} /></div>
      <div><strong>Variabilidade desta tela</strong><p>{children}</p></div>
    </aside>
  )
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }) {
  return <span className={`status status-${tone}`}>{children}</span>
}

export function OccupancyBar({ used, total, label = true }: { used: number; total: number; label?: boolean }) {
  const percentage = Math.round((used / total) * 100)
  return (
    <div>
      {label && <div className="mb-2 flex justify-between text-xs text-slate-500"><span>{used} ocupadas</span><span>{total - used} livres</span></div>}
      <div className="occupancy-track"><span style={{ width: `${percentage}%` }} /></div>
    </div>
  )
}

export function StatCard({ label, value, helper, icon }: { label: string; value: string; helper: string; icon?: ReactNode }) {
  return (
    <Card className="stat-card">
      <div className="stat-icon">{icon}</div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <strong className="mt-2 block text-3xl tracking-tight text-slate-900">{value}</strong>
      <p className="mt-2 text-xs text-slate-500">{helper}</p>
    </Card>
  )
}

export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="form-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><div className="empty-icon"><Info size={22} /></div><strong>{title}</strong><p>{description}</p></div>
}

export function Alert({ children, tone = 'success' }: { children: ReactNode; tone?: 'success' | 'warning' | 'danger' }) {
  const Icon = tone === 'success' ? Check : AlertTriangle
  return <div className={`alert alert-${tone}`}><Icon size={18} /><div>{children}</div></div>
}

export function AccessDenied({ reason }: { reason: string }) {
  return (
    <main className="min-h-screen bg-slate-50 p-6 grid place-items-center">
      <Card className="max-w-lg text-center p-10">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600"><AlertTriangle /></div>
        <p className="eyebrow">Acesso protegido</p>
        <h1 className="mt-2 text-2xl font-bold">Conteúdo indisponível</h1>
        <p className="mt-3 text-slate-500">{reason}</p>
        <Link className="button button-primary mt-7 inline-flex" to="/">Trocar cliente ou perfil <ArrowRight size={16} /></Link>
      </Card>
    </main>
  )
}

export function ConfirmDialog({ title, description, onConfirm, onCancel }: { title: string; description: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onCancel} aria-label="Fechar"><X size={18} /></button>
        <h2 id="confirm-title">{title}</h2><p>{description}</p>
        <div className="mt-6 flex justify-end gap-2"><Button variant="ghost" onClick={onCancel}>Cancelar</Button><Button variant="danger" onClick={onConfirm}>Excluir</Button></div>
      </div>
    </div>
  )
}

export interface Column<T> { header: string; render: (row: T) => ReactNode; className?: string }
export function DataTable<T extends { id: string }>({ rows, columns, emptyMessage = 'Nenhum registro encontrado.' }: { rows: T[]; columns: Column<T>[]; emptyMessage?: string }) {
  return (
    <div className="table-wrap">
      <table><thead><tr>{columns.map((column) => <th key={column.header} className={column.className}>{column.header}</th>)}</tr></thead>
      <tbody>{rows.length ? rows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column.header} className={column.className}>{column.render(row)}</td>)}</tr>) : <tr><td colSpan={columns.length} className="py-10 text-center text-slate-400">{emptyMessage}</td></tr>}</tbody></table>
    </div>
  )
}
