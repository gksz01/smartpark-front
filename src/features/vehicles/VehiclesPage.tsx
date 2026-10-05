import { Car, Plus, Tag } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTenant } from '../../core/app-context'
import type { Vehicle } from '../../core/types'
import { FormModal } from '../../shared/crud/FormModal'
import { RowActions } from '../../shared/crud/RowActions'
import { Alert, Button, Card, ConfirmDialog, FormField, PageHeader, StatusBadge, VariationInfo } from '../../shared/ui'

const EMPTY_VEHICLE: Omit<Vehicle, 'id'> = { plate: '', model: '', color: '', nickname: '', rfidTag: '', unit: '' }

export function VehiclesPage() {
  const { state, tenant, vehiclesError, saveVehicle, deleteVehicle } = useTenant()
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [form, setForm] = useState(EMPTY_VEHICLE)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const openCreate = () => { setEditing(null); setForm(EMPTY_VEHICLE); setFormOpen(true); setMessage(''); setError('') }
  const openEdit = (vehicle: Vehicle) => { setEditing(vehicle); setForm({ plate: vehicle.plate, model: vehicle.model, color: vehicle.color, nickname: vehicle.nickname, rfidTag: vehicle.rfidTag ?? '', unit: vehicle.unit ?? '' }); setFormOpen(true); setMessage(''); setError('') }
  const close = () => setFormOpen(false)
  // CREATE / UPDATE: a API valida (inclusive a placa) e grava no SQLite
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await saveVehicle({ id: editing?.id, ...form, plate: form.plate.toUpperCase() })
      setFormOpen(false)
      setMessage(editing ? 'Veículo atualizado com sucesso.' : 'Veículo cadastrado com sucesso.')
    } catch (failure) {
      setError((failure as Error).message)
    }
  }
  // DELETE
  const confirmDelete = async (id: string) => {
    setDeleteId(null)
    try {
      await deleteVehicle(id)
      setMessage('Veículo excluído.')
    } catch (failure) {
      setError((failure as Error).message)
    }
  }
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))

  return <div className="portal-content page-top"><PageHeader eyebrow="Garagem digital" title="Meus veículos" description="Gerencie as credenciais vinculadas ao seu perfil." action={<Button onClick={openCreate}><Plus size={17} /> Novo veículo</Button>} />
    <VariationInfo>O CRUD usa um único formulário. Campos adicionais são declarados em `vehicleFields`: unidade no Condomínio e tag RFID na Empresa.</VariationInfo>
    {message && <Alert>{message}</Alert>}
    {(vehiclesError || (error && !formOpen)) && <Alert tone="danger">{vehiclesError || error}</Alert>}
    <div className="vehicle-grid">{state.vehicles.map((vehicle, index) => <Card key={vehicle.id} className="vehicle-card"><div className="vehicle-card-art"><span className="vehicle-number">0{index + 1}</span><Car size={48} strokeWidth={1.3} /><StatusBadge tone={index === 0 ? 'success' : 'neutral'}>{index === 0 ? 'Principal' : 'Ativo'}</StatusBadge></div><div className="vehicle-card-body"><div><p className="eyebrow">{vehicle.nickname}</p><h2>{vehicle.model}</h2><p>{vehicle.color} · <strong>{vehicle.plate}</strong></p></div>{tenant.vehicleFields.map((field) => <div className="tenant-field-value" key={field.key}><Tag size={15} /><span>{field.label}</span><strong>{vehicle[field.key] || 'Não informado'}</strong></div>)}<RowActions className="vehicle-actions" label={vehicle.nickname} onEdit={() => openEdit(vehicle)} onDelete={() => setDeleteId(vehicle.id)} /></div></Card>)}</div>
    {!state.vehicles.length && <Card className="empty-state"><Car size={28} /><h2>Nenhum veículo cadastrado</h2><p>Adicione um veículo para reservar e acessar estacionamentos.</p><Button onClick={openCreate}><Plus size={17} /> Adicionar veículo</Button></Card>}
    {formOpen && (
      <FormModal id="vehicle-form" eyebrow="Cadastro reutilizável" title={editing ? 'Editar veículo' : 'Novo veículo'} error={error} submitLabel="Salvar veículo" className="vehicle-modal" bodyClassName="form-grid mt-6" onSubmit={submit} onClose={close}>
        <FormField label="Apelido"><input required value={form.nickname} onChange={(event) => update('nickname', event.target.value)} placeholder="Ex.: Meu carro" /></FormField><FormField label="Placa"><input required minLength={7} maxLength={8} value={form.plate} onChange={(event) => update('plate', event.target.value)} placeholder="ABC1D23" /></FormField><FormField label="Modelo"><input required value={form.model} onChange={(event) => update('model', event.target.value)} placeholder="Ex.: Honda City" /></FormField><FormField label="Cor"><input required value={form.color} onChange={(event) => update('color', event.target.value)} placeholder="Ex.: Cinza" /></FormField>{tenant.vehicleFields.map((field) => <FormField key={field.key} label={field.label}><input required value={form[field.key]} onChange={(event) => update(field.key, event.target.value)} placeholder={field.placeholder} /></FormField>)}
      </FormModal>
    )}
    {deleteId && <ConfirmDialog title="Excluir veículo?" description="O veículo deixará de aparecer em reservas e acessos futuros." onCancel={() => setDeleteId(null)} onConfirm={() => confirmDelete(deleteId)} />}
  </div>
}
