import { Edit3, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../ui'

interface RowActionsProps {
  /** Complemento dos aria-labels: "Editar <label>" / "Excluir <label>" */
  label: string
  onEdit?: () => void
  onDelete: () => void
  className?: string
  /** Ações próprias do CRUD, exibidas antes de Editar (ex.: Ativar, Simular sensor) */
  children?: ReactNode
}

/** Botões Editar e Excluir de uma linha (ou card), com aria-labels para acessibilidade e testes. */
export function RowActions({ label, onEdit, onDelete, className = 'flex gap-2', children }: RowActionsProps) {
  return (
    <div className={className}>
      {children}
      {onEdit && <Button variant="secondary" onClick={onEdit} aria-label={`Editar ${label}`}><Edit3 size={16} /> Editar</Button>}
      <Button variant="ghost" onClick={onDelete} aria-label={`Excluir ${label}`}><Trash2 size={16} /> Excluir</Button>
    </div>
  )
}
