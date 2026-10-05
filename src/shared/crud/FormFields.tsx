import type { InputHTMLAttributes } from 'react'
import { FormField } from '../ui'
import { SelectField, type SelectOption } from './SelectField'

type InputAttributes = Pick<InputHTMLAttributes<HTMLInputElement>, 'min' | 'max' | 'step' | 'minLength' | 'maxLength'>

/**
 * Configuração de INTERFACE de um campo do formulário (rótulo, tipo, opções, visibilidade).
 * Regras de negócio NÃO entram aqui: validações e cálculos ficam na API e nas classes de domínio.
 */
export type FieldConfig<Form> = {
  name: keyof Form & string
  /** Texto fixo ou dependente do formulário (ex.: "Valor da hora" / "Valor da diária") */
  label: string | ((form: Form) => string)
  hint?: string
  /** Mostra o campo só em algumas situações (ex.: teto diário só na tarifa por hora) */
  visible?: (form: Form) => boolean
} & (
  | { type: 'text' | 'number'; placeholder?: string; optional?: boolean; attributes?: InputAttributes | ((form: Form) => InputAttributes) }
  | { type: 'select'; options: readonly SelectOption[] }
  /** Booleano exibido como select (ex.: Ativo / Inativo), na ordem informada */
  | { type: 'boolean'; choices: readonly { key: string; label: string; value: boolean }[] }
)

/** Ativo / Inativo, usado por vários cadastros. */
export const ACTIVE_CHOICES = [{ key: 'ativo', label: 'Ativo', value: true }, { key: 'inativo', label: 'Inativo', value: false }] as const

interface FormFieldsProps<Form> {
  fields: FieldConfig<Form>[]
  form: Form
  onChange: (form: Form) => void
}

/** Monta os campos do formulário a partir da lista de FieldConfig. */
export function FormFields<Form>({ fields, form, onChange }: FormFieldsProps<Form>) {
  const values = form as Record<string, unknown>
  const set = (name: string, value: unknown) => onChange({ ...form, [name]: value })

  return fields.filter((field) => !field.visible || field.visible(form)).map((field) => {
    const label = typeof field.label === 'function' ? field.label(form) : field.label
    if (field.type === 'select') {
      return <SelectField key={field.name} label={label} hint={field.hint} value={String(values[field.name])} options={field.options} onChange={(value) => set(field.name, value)} />
    }
    if (field.type === 'boolean') {
      const selected = field.choices.find((choice) => choice.value === values[field.name])
      const options = field.choices.map((choice) => ({ value: choice.key, label: choice.label }))
      return <SelectField key={field.name} label={label} hint={field.hint} value={selected?.key ?? ''} options={options} onChange={(key) => set(field.name, field.choices.find((choice) => choice.key === key)?.value)} />
    }
    const attributes = typeof field.attributes === 'function' ? field.attributes(form) : field.attributes
    return (
      <FormField key={field.name} label={label} hint={field.hint}>
        <input type={field.type} required={!field.optional} value={String(values[field.name] ?? '')} onChange={(event) => set(field.name, event.target.value)} placeholder={field.placeholder} {...attributes} />
      </FormField>
    )
  })
}
