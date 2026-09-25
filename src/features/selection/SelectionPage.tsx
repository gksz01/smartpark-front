import { ArrowRight, Building2, Check, HeartPulse, Landmark, ShoppingBag, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '../../core/app-context'
import { ACCESS_LABELS, FEATURE_LABELS, landingForRole, ROLE_LABELS, ROLE_ORDER, TENANTS, TENANT_ORDER } from '../../core/config'
import type { Role, TenantId } from '../../core/types'
import { Alert, Brand, Button, Card, VariationInfo } from '../../shared/ui'

const TENANT_ICONS = { shopping: ShoppingBag, condominium: Building2, hospital: HeartPulse, company: Landmark }

export function SelectionPage() {
  const { state, configurationError, selectContext, setAcademicMode } = useTenant()
  const [tenantId, setTenantId] = useState<TenantId>(state.tenantId)
  const [role, setRole] = useState<Role>(state.role)
  const navigate = useNavigate()
  const tenant = TENANTS[tenantId]

  const chooseTenant = (id: TenantId) => {
    const nextTenant = TENANTS[id]
    setTenantId(id)
    if (!nextTenant.allowedRoles.includes(role)) setRole(nextTenant.allowedRoles[0])
  }

  const enter = () => {
    selectContext(tenantId, role)
    navigate(landingForRole(role))
  }

  return (
    <main className="selection-page">
      <div className="selection-orb selection-orb-one" /><div className="selection-orb selection-orb-two" />
      <div className="selection-container">
        <header className="selection-header"><Brand /><div className="academic-pill"><Sparkles size={15} /> Protótipo acadêmico · Parte 3</div></header>
        <div className="selection-intro"><p className="eyebrow">Linha de Produto de Software</p><h1>Um produto.<br /><span>Quatro experiências.</span></h1><p>Escolha um cliente e um perfil para ver a mesma base se adaptar em tempo real.</p></div>
        {configurationError && <Alert tone="warning"><strong>Configuração de URL ajustada.</strong><br />{configurationError}</Alert>}
        <div className="selection-grid">
          <section>
            <div className="section-title"><span>01</span><div><h2>Escolha o cliente</h2><p>Cada operação ativa identidade e capacidades próprias.</p></div></div>
            <div className="tenant-picker">{TENANT_ORDER.map((id) => { const item = TENANTS[id]; const Icon = TENANT_ICONS[id]; return <button key={id} className={tenantId === id ? 'selected' : ''} onClick={() => chooseTenant(id)}><span className="tenant-option-icon"><Icon size={21} /></span><span><strong>{item.shortName}</strong><small>{ACCESS_LABELS[item.accessMethod]}</small></span>{tenantId === id && <span className="tenant-check"><Check size={14} /></span>}</button> })}</div>
          </section>
          <section>
            <div className="section-title"><span>02</span><div><h2>Escolha o perfil</h2><p>Os acessos disponíveis dependem do cliente.</p></div></div>
            <div className="role-picker">{ROLE_ORDER.filter((item) => tenant.allowedRoles.includes(item)).map((item) => <button key={item} className={role === item ? 'selected' : ''} onClick={() => setRole(item)}>{ROLE_LABELS[item]}{role === item && <Check size={14} />}</button>)}</div>
            <Card className="configuration-preview">
              <div className="flex items-start justify-between gap-4"><div><span className="preview-logo">{tenant.logo}</span><h3>{tenant.name}</h3><p>{tenant.eyebrow}</p></div><span className="access-chip">{ACCESS_LABELS[tenant.accessMethod]}</span></div>
              <div className="feature-list">{Object.entries(tenant.features).map(([feature, enabled]) => <span key={feature} className={enabled ? 'enabled' : 'disabled'}><span>{enabled ? 'ON' : 'OFF'}</span>{FEATURE_LABELS[feature as keyof typeof FEATURE_LABELS]}</span>)}</div>
            </Card>
            <label className="selection-academic"><input type="checkbox" checked={state.academicMode} onChange={(event) => setAcademicMode(event.target.checked)} /><span /><div><strong>Modo de demonstração acadêmica</strong><small>Exibe como cada tela implementa variabilidade e reúso.</small></div></label>
            <Button className="enter-button" onClick={enter}>Entrar como {ROLE_LABELS[role]} <ArrowRight size={18} /></Button>
          </section>
        </div>
        <VariationInfo>Esta interface lê uma configuração central para combinar marca, método de acesso, features e perfis permitidos antes de compor o produto.</VariationInfo>
        <footer className="selection-footer"><span>SmartPark · LPS acadêmica</span><span>Configuração • Feature flags • RBAC • White-label</span></footer>
      </div>
    </main>
  )
}
