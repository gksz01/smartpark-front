import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FormModal } from './FormModal'
import { RowActions } from './RowActions'
import { SelectField } from './SelectField'

afterEach(cleanup)

describe('componentes reutilizáveis de CRUD', () => {
  it('FormModal mostra título, campos e erro; Cancelar e X fecham; o envio chama onSubmit', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSubmit = vi.fn((event) => event.preventDefault())
    render(<FormModal id="teste" eyebrow="Cadastro" title="Nova pessoa" error="Falhou" submitLabel="Salvar" onSubmit={onSubmit} onClose={onClose}><input aria-label="Nome" /></FormModal>)
    expect(screen.getByRole('dialog', { name: 'Nova pessoa' })).toBeInTheDocument()
    expect(screen.getByText('Falhou')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('FormModal sem Cancelar (cancelLabel = null)', () => {
    render(<FormModal id="t" eyebrow="E" title="T" submitLabel="Confirmar" cancelLabel={null} onSubmit={vi.fn()} onClose={vi.fn()}>campos</FormModal>)
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })

  it('RowActions gera Editar/Excluir com aria-label e ações extras antes', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(<RowActions label="vaga A-01" onEdit={onEdit} onDelete={onDelete}><button>Ativar</button></RowActions>)
    expect(screen.getAllByRole('button').map((botao) => botao.textContent?.trim())).toEqual(['Ativar', 'Editar', 'Excluir'])
    await user.click(screen.getByRole('button', { name: 'Editar vaga A-01' }))
    await user.click(screen.getByRole('button', { name: 'Excluir vaga A-01' }))
    expect(onEdit).toHaveBeenCalled()
    expect(onDelete).toHaveBeenCalled()
  })

  it('SelectField aceita textos ou { value, label }', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SelectField label="Tipo" value="a" options={[{ value: 'a', label: 'Opção A' }, 'B']} onChange={onChange} />)
    expect(Array.from((screen.getByLabelText('Tipo') as HTMLSelectElement).options).map((option) => option.text)).toEqual(['Opção A', 'B'])
    await user.selectOptions(screen.getByLabelText('Tipo'), 'B')
    expect(onChange).toHaveBeenCalledWith('B')
  })
})

describe('FormFields (formulário declarativo)', () => {
  type Form = { name: string; kind: string; value: string; active: boolean }
  const fields: import('./FormFields').FieldConfig<Form>[] = [
    { name: 'name', label: 'Nome', type: 'text', placeholder: 'Nome completo' },
    { name: 'kind', label: 'Tipo', type: 'select', options: [{ value: 'a', label: 'Tipo A' }, { value: 'b', label: 'Tipo B' }] },
    { name: 'value', label: (form) => (form.kind === 'a' ? 'Valor A' : 'Valor B'), type: 'number', visible: (form) => form.kind !== 'b' },
    { name: 'active', label: 'Situação', type: 'boolean', choices: [{ key: 'ativo', label: 'Ativo', value: true }, { key: 'inativo', label: 'Inativo', value: false }] },
  ]

  it('monta os campos, aplica rótulo e visibilidade dependentes do formulário e devolve o form atualizado', async () => {
    const { FormFields } = await import('./FormFields')
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<FormFields fields={fields} form={{ name: '', kind: 'a', value: '', active: true }} onChange={onChange} />)
    expect(screen.getByLabelText('Nome')).toBeRequired()
    expect(screen.getByLabelText('Valor A')).toHaveAttribute('type', 'number')
    await user.selectOptions(screen.getByLabelText('Situação'), 'inativo')
    expect(onChange).toHaveBeenLastCalledWith({ name: '', kind: 'a', value: '', active: false })

    rerender(<FormFields fields={fields} form={{ name: '', kind: 'b', value: '', active: true }} onChange={onChange} />)
    expect(screen.queryByLabelText(/Valor/)).not.toBeInTheDocument()
  })
})
