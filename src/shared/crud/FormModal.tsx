import { X } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { Alert, Button } from '../ui'

interface FormModalProps {
  /** Usado no id do título (acessibilidade): `${id}-title` */
  id: string
  eyebrow: string
  title: string
  description?: string
  error?: string
  submitLabel: string
  /** Rótulo do botão de fechar no rodapé; null = sem botão (envio em largura total) */
  cancelLabel?: string | null
  className?: string
  /** Layout dos campos (padrão: um embaixo do outro) */
  bodyClassName?: string
  /** Conteúdo exibido depois dos campos e antes do erro (ex.: estimativa) */
  extra?: ReactNode
  onSubmit: (event: FormEvent) => void
  onClose: () => void
  children: ReactNode
}

/** Modal de formulário padrão: título, botão X, campos, erro da API e rodapé. */
export function FormModal({ id, eyebrow, title, description, error, submitLabel, cancelLabel = 'Cancelar', className = '', bodyClassName = 'mt-6 space-y-4', extra, onSubmit, onClose, children }: FormModalProps) {
  return (
    <div className="modal-backdrop">
      <form className={`modal ${className}`} onSubmit={onSubmit} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={`${id}-title`}>{title}</h2>
        {description && <p>{description}</p>}
        <div className={bodyClassName}>{children}</div>
        {extra}
        {error && <div className="mt-5"><Alert tone="danger">{error}</Alert></div>}
        {cancelLabel === null ? (
          <Button type="submit" className="mt-6 w-full justify-center">{submitLabel}</Button>
        ) : (
          <div className="mt-7 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>{cancelLabel}</Button>
            <Button type="submit">{submitLabel}</Button>
          </div>
        )}
      </form>
    </div>
  )
}
