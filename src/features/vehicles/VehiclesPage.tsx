import { Car, Edit3, Plus, Tag, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTenant } from '../../core/app-context'
import type { Vehicle } from '../../core/types'
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
    <div className="vehicle-grid">{state.vehicles.map((vehicle, index) => <Card key={vehicle.id} className="vehicle-card"><div className="vehicle-card-art"><span className="vehicle-number">0{index + 1}</span><Car size={48} strokeWidth={1.3} /><StatusBadge tone={index === 0 ? 'success' : 'neutral'}>{index === 0 ? 'Principal' : 'Ativo'}</StatusBadge></div><div className="vehicle-card-body"><div><p className="eyebrow">{vehicle.nickname}</p><h2>{vehicle.model}</h2><p>{vehicle.color} · <strong>{vehicle.plate}</strong></p></div>{tenant.vehicleFields.map((field) => <div className="tenant-field-value" key={field.key}><Tag size={15} /><span>{field.label}</span><strong>{vehicle[field.key] || 'Não informado'}</strong></div>)}<div className="vehicle-actions"><Button variant="secondary" onClick={() => openEdit(vehicle)}><Edit3 size={16} /> Editar</Button><Button variant="ghost" onClick={() => setDeleteId(vehicle.id)} aria-label={`Excluir ${vehicle.nickname}`}><Trash2 size={16} /> Excluir</Button></div></div></Card>)}</div>
    {!state.vehicles.length && <Card className="empty-state"><Car size={28} /><h2>Nenhum veículo cadastrado</h2><p>Adicione um veículo para reservar e acessar estacionamentos.</p><Button onClick={openCreate}><Plus size={17} /> Adicionar veículo</Button></Card>}
    {formOpen && <div className="modal-backdrop"><form className="modal vehicle-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="vehicle-form-title"><button type="button" className="modal-close" onClick={close} aria-label="Fechar"><X size={18} /></button><p className="eyebrow">Cadastro reutilizável</p><h2 id="vehicle-form-title">{editing ? 'Editar veículo' : 'Novo veículo'}</h2><div className="form-grid mt-6"><FormField label="Apelido"><input required value={form.nickname} onChange={(event) => update('nickname', event.target.value)} placeholder="Ex.: Meu carro" /></FormField><FormField label="Placa"><input required minLength={7} maxLength={8} value={form.plate} onChange={(event) => update('plate', event.target.value)} placeholder="ABC1D23" /></FormField><FormField label="Modelo"><input required value={form.model} onChange={(event) => update('model', event.target.value)} placeholder="Ex.: Honda City" /></FormField><FormField label="Cor"><input required value={form.color} onChange={(event) => update('color', event.target.value)} placeholder="Ex.: Cinza" /></FormField>{tenant.vehicleFields.map((field) => <FormField key={field.key} label={field.label}><input required value={form[field.key]} onChange={(event) => update(field.key, event.target.value)} placeholder={field.placeholder} /></FormField>)}</div>{error && <div className="mt-5"><Alert tone="danger">{error}</Alert></div>}<div className="mt-7 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={close}>Cancelar</Button><Button type="submit">Salvar veículo</Button></div></form></div>}
    {deleteId && <ConfirmDialog title="Excluir veículo?" description="O veículo deixará de aparecer em reservas e acessos futuros." onCancel={() => setDeleteId(null)} onConfirm={() => confirmDelete(deleteId)} />}
  </div>
}
