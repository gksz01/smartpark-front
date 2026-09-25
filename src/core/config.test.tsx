import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { TenantProvider } from './app-context'
import { FeatureGate, RoleGate } from './gates'
import { hasPermission, TENANTS } from './config'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

function renderGate(url: string) {
  window.history.replaceState({}, '', url)
  return render(
    <BrowserRouter>
      <TenantProvider>
        <FeatureGate feature="reservation"><span>Reserva disponível</span></FeatureGate>
        <RoleGate roles={['driver']}><span>Área do motorista</span></RoleGate>
      </TenantProvider>
    </BrowserRouter>,
  )
}

describe('configuração da linha de produto', () => {
  it('mantém a matriz principal de features por tenant', () => {
    expect(TENANTS.shopping.features.reservation).toBe(true)
    expect(TENANTS.condominium.features.payments).toBe(false)
    expect(TENANTS.hospital.features.medicalAgreement).toBe(true)
    expect(TENANTS.company.accessMethod).toBe('RFID')
  })

  it('centraliza permissões por perfil', () => {
    expect(hasPermission('admin', 'configuration')).toBe(true)
    expect(hasPermission('driver', 'configuration')).toBe(false)
    expect(hasPermission('operator', 'access')).toBe(true)
  })

  it('FeatureGate e RoleGate exibem conteúdo permitido', () => {
    renderGate('/?tenant=shopping&role=driver')
    expect(screen.getByText('Reserva disponível')).toBeInTheDocument()
    expect(screen.getByText('Área do motorista')).toBeInTheDocument()
  })

  it('FeatureGate e RoleGate ocultam conteúdo desabilitado', () => {
    renderGate('/?tenant=condominium&role=resident')
    expect(screen.queryByText('Reserva disponível')).not.toBeInTheDocument()
    expect(screen.queryByText('Área do motorista')).not.toBeInTheDocument()
  })
})
