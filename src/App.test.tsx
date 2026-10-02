import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { TenantProvider, TenantThemeProvider } from './core/app-context'
import { createVehicle, deleteVehicle, listVehicles, updateVehicle } from './test/fakeVehiclesApi'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

function renderRoute(url: string) {
  window.history.replaceState({}, '', url)
  return render(
    <BrowserRouter>
      <TenantProvider>
        <TenantThemeProvider>
          <App />
        </TenantThemeProvider>
      </TenantProvider>
    </BrowserRouter>,
  )
}

const routes = [
  ['/?tenant=shopping&role=driver', /Um produto/],
  ['/app/home?tenant=shopping&role=driver', /Sua vaga, do seu jeito/],
  ['/app/parking?tenant=shopping&role=driver', 'Estacionamentos próximos'],
  ['/app/parking/central?tenant=shopping&role=driver', 'Estacionamento Central'],
  ['/app/reservations/new?tenant=shopping&role=driver', 'Garanta sua vaga'],
  ['/app/vehicles?tenant=shopping&role=driver', 'Meus veículos'],
  ['/app/payments?tenant=shopping&role=driver', 'Finalizar estacionamento'],
  ['/admin/dashboard?tenant=shopping&role=admin', /Visão geral/],
  ['/admin/spaces?tenant=shopping&role=admin', 'Vagas e setores'],
  ['/admin/access?tenant=shopping&role=admin', 'Entradas e saídas'],
  ['/admin/configuration?tenant=shopping&role=admin', 'Módulos e personalização'],
  ['/admin/medical-agreement?tenant=hospital&role=admin', 'Convênio médico'],
] as const

describe('12 interfaces navegáveis', () => {
  it.each(routes)('renderiza %s', (url, heading) => {
    renderRoute(url)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  })
})

describe('proteção de rotas', () => {
  it('bloqueia reserva quando a feature está desligada', () => {
    renderRoute('/app/reservations/new?tenant=condominium&role=resident')
    expect(screen.getByRole('heading', { name: 'Conteúdo indisponível' })).toBeInTheDocument()
    expect(screen.getByText(/Reserva não está disponível/)).toBeInTheDocument()
  })

  it('bloqueia dashboard para motorista', () => {
    renderRoute('/admin/dashboard?tenant=shopping&role=driver')
    expect(screen.getByText(/Motorista não possui permissão/)).toBeInTheDocument()
  })

  it('bloqueia convênio fora do Hospital', () => {
    renderRoute('/admin/medical-agreement?tenant=shopping&role=admin')
    expect(screen.getByText(/Convênio médico não está disponível/)).toBeInTheDocument()
  })

  it('leva uma configuração inválida para a seleção com aviso', async () => {
    renderRoute('/app/home?tenant=inexistente&role=driver')
    expect(await screen.findByRole('heading', { name: /Um produto/ })).toBeInTheDocument()
    expect(screen.getByText(/não existe nesta configuração/)).toBeInTheDocument()
  })
})

describe('inicialização da configuração', () => {
  it('prioriza tenant e perfil da URL sobre o localStorage', () => {
    localStorage.setItem('smartpark:parte3:v1', JSON.stringify({ tenantId: 'company', role: 'employee', academicMode: false }))
    renderRoute('/?tenant=hospital&role=admin&academic=1')
    expect(screen.getAllByText('Hospital Santa Clara').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Administrador' })).toHaveClass('selected')
    expect(screen.getByText('Variabilidade desta tela')).toBeInTheDocument()
  })
})

describe('veículos', () => {
  it('cadastra veículo com o formulário reutilizável', async () => {
    const user = userEvent.setup()
    renderRoute('/app/vehicles?tenant=shopping&role=driver')
    await user.click(screen.getByRole('button', { name: /Novo veículo/ }))
    await user.type(screen.getByLabelText('Apelido'), 'Trabalho')
    await user.type(screen.getByLabelText('Placa'), 'abc1d23')
    await user.type(screen.getByLabelText('Modelo'), 'Corolla')
    await user.type(screen.getByLabelText('Cor'), 'Preto')
    await user.click(screen.getByRole('button', { name: 'Salvar veículo' }))
    expect(await screen.findByText('Veículo cadastrado com sucesso.')).toBeInTheDocument()
    expect(screen.getByText('Corolla')).toBeInTheDocument()
    expect(screen.getByText(/ABC1D23/)).toBeInTheDocument()
    expect(createVehicle).toHaveBeenCalledWith('shopping', expect.objectContaining({ plate: 'ABC1D23', model: 'Corolla' }))
  })

  it('carrega pela API apenas os veículos do tenant ativo', async () => {
    renderRoute('/app/vehicles?tenant=company&role=employee')
    expect(await screen.findByText('Chevrolet Onix')).toBeInTheDocument()
    expect(screen.getByText('NX-71520')).toBeInTheDocument() // campo variável da Empresa
    expect(screen.queryByText('Honda City')).not.toBeInTheDocument() // veículo do Shopping
    expect(listVehicles).toHaveBeenCalledWith('company')
  })

  it('edita e exclui um veículo pela API', async () => {
    const user = userEvent.setup()
    renderRoute('/app/vehicles?tenant=shopping&role=driver')
    await user.click(await screen.findByRole('button', { name: /Editar/ }))
    const modelo = screen.getByLabelText('Modelo')
    await user.clear(modelo)
    await user.type(modelo, 'Honda Civic')
    await user.click(screen.getByRole('button', { name: 'Salvar veículo' }))
    expect(await screen.findByText('Veículo atualizado com sucesso.')).toBeInTheDocument()
    expect(screen.getByText('Honda Civic')).toBeInTheDocument()
    expect(updateVehicle).toHaveBeenCalledWith('shopping', '1', expect.objectContaining({ model: 'Honda Civic' }))

    await user.click(screen.getByRole('button', { name: 'Excluir Meu carro' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(await screen.findByText('Veículo excluído.')).toBeInTheDocument()
    expect(screen.queryByText('Honda Civic')).not.toBeInTheDocument()
    expect(deleteVehicle).toHaveBeenCalledWith('shopping', '1')
  })

  it('mostra no formulário o erro devolvido pela API', async () => {
    createVehicle.mockRejectedValueOnce(new Error('Placa inválida. Use o padrão ABC1234 ou ABC1D23.'))
    const user = userEvent.setup()
    renderRoute('/app/vehicles?tenant=shopping&role=driver')
    await user.click(screen.getByRole('button', { name: /Novo veículo/ }))
    await user.type(screen.getByLabelText('Apelido'), 'Teste')
    await user.type(screen.getByLabelText('Placa'), '1234567')
    await user.type(screen.getByLabelText('Modelo'), 'Gol')
    await user.type(screen.getByLabelText('Cor'), 'Prata')
    await user.click(screen.getByRole('button', { name: 'Salvar veículo' }))
    expect(await screen.findByText(/Placa inválida/)).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument() // o formulário continua aberto
  })
})
