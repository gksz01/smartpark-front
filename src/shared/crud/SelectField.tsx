import { FormField } from '../ui'

/** Opção do select: um texto (valor = rótulo) ou { value, label }. */
export type SelectOption = string | { value: string; label: string }

interface SelectFieldProps {
  label: string
  value: string
  options: readonly SelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
  hint?: string
}

/** Campo de seleção: FormField + select montado a partir de uma lista de opções. */
export function SelectField({ label, value, options, onChange, disabled, hint }: SelectFieldProps) {
  return (
    <FormField label={label} hint={hint}>
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const { value: optionValue, label: optionLabel } = typeof option === 'string' ? { value: option, label: option } : option
          return <option key={optionValue} value={optionValue}>{optionLabel}</option>
        })}
      </select>
    </FormField>
  )
}
