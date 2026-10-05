import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { TenantProvider, TenantThemeProvider } from './core/app-context'
import { createAccess, deleteAccess, listAccess, updateAccess } from './test/fakeAccessApi'
import { cancelReservation, createReservation, deleteReservation, listReservations, updateReservation } from './test/fakeReservationsApi'
import { createSpace, deleteSpace, listSpaces, updateSpace } from './test/fakeSpacesApi'
import { createTariff, deleteTariff, listTariffs, updateTariff } from './test/fakeTariffsApi'
import { createUser, deleteUser, listUsers, updateUser } from './test/fakeUsersApi'
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
  ['/app/reservations?tenant=shopping&role=driver', 'Garanta sua vaga'],
  ['/app/reservations/new?tenant=shopping&role=driver', 'Garanta sua vaga'],
  ['/app/vehicles?tenant=shopping&role=driver', 'Meus veículos'],
  ['/app/payments?tenant=shopping&role=driver', 'Finalizar estacionamento'],
  ['/admin/dashboard?tenant=shopping&role=admin', /Visão geral/],
  ['/admin/spaces?tenant=shopping&role=admin', 'Vagas e setores'],
  ['/admin/access?tenant=shopping&role=admin', 'Entradas e saídas'],
  ['/admin/users?tenant=shopping&role=admin', 'Pessoas'],
  ['/admin/tariffs?tenant=shopping&role=admin', 'Tarifas'],
  ['/admin/configuration?tenant=shopping&role=admin', 'Módulos e personalização'],
  ['/admin/medical-agreement?tenant=hospital&role=admin', 'Convênio médico'],
] as const

describe('interfaces navegáveis', () => {
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

describe('pessoas (usuários)', () => {
  it('lista as pessoas do tenant com tipo, perfil e situação', async () => {
    renderRoute('/admin/users?tenant=hospital&role=admin')
    expect(await screen.findByText('Helena Moreira')).toBeInTheDocument()
    const tabela = within(screen.getByRole('table'))
    expect(tabela.getByText('Paciente')).toBeInTheDocument()
    expect(tabela.getByText('Acompanhante')).toBeInTheDocument()
    expect(tabela.getByText('Inativo')).toBeInTheDocument() // Beatriz está inativa
    expect(listUsers).toHaveBeenCalledWith('hospital')
  })

  it('cadastra uma pessoa com tipo e perfil do tenant', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/users?tenant=condominium&role=admin')
    await user.click(screen.getByRole('button', { name: /Nova pessoa/ }))
    await user.type(screen.getByLabelText('Nome'), 'Ana Prado')
    await user.type(screen.getByLabelText('Documento'), '111.222.333-44')
    await user.selectOptions(screen.getByLabelText('Tipo'), 'visitante')
    await user.selectOptions(screen.getByLabelText('Perfil'), 'visitor')
    await user.click(screen.getByRole('button', { name: 'Salvar pessoa' }))
    expect(await screen.findByText('Pessoa cadastrada com sucesso.')).toBeInTheDocument()
    expect(screen.getByText('Ana Prado')).toBeInTheDocument()
    expect(createUser).toHaveBeenCalledWith('condominium', { name: 'Ana Prado', document: '111.222.333-44', type: 'visitante', role: 'visitor', active: true })
  })

  it('edita uma pessoa (inclusive a situação)', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/users?tenant=company&role=admin')
    await user.click(await screen.findByRole('button', { name: 'Editar Lucas Martins' }))
    await user.selectOptions(screen.getByLabelText('Situação'), 'inativo')
    await user.click(screen.getByRole('button', { name: 'Salvar pessoa' }))
    expect(await screen.findByText('Pessoa atualizada com sucesso.')).toBeInTheDocument()
    expect(screen.getByText('Inativo')).toBeInTheDocument()
    expect(updateUser).toHaveBeenCalledWith('company', '6', expect.objectContaining({ active: false }))
  })

  it('exclui uma pessoa após confirmação', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/users?tenant=shopping&role=admin')
    await user.click(await screen.findByRole('button', { name: 'Excluir Marina Costa' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(await screen.findByText('Pessoa excluída.')).toBeInTheDocument()
    expect(screen.queryByText('Marina Costa')).not.toBeInTheDocument()
    expect(deleteUser).toHaveBeenCalledWith('shopping', '1')
  })

  it('ao trocar de tenant, carrega as pessoas do novo tenant', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/users?tenant=hospital&role=admin')
    expect(await screen.findByText('Helena Moreira')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Trocar contexto/ }))
    await user.click(screen.getByRole('button', { name: /Horizonte/ }))
    await user.click(screen.getByRole('button', { name: /Entrar como Administrador/ }))
    await user.click(await screen.findByRole('link', { name: /Pessoas/ }))

    expect(await screen.findByText('Juliana Reis')).toBeInTheDocument()
    expect(screen.queryByText('Helena Moreira')).not.toBeInTheDocument()
    expect(listUsers).toHaveBeenLastCalledWith('condominium')
  })

  it('o formulário oferece apenas os tipos de pessoa do tenant', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/users?tenant=hospital&role=admin')
    await user.click(screen.getByRole('button', { name: /Nova pessoa/ }))
    const tipos = Array.from((screen.getByLabelText('Tipo') as HTMLSelectElement).options).map((option) => option.text)
    expect(tipos).toEqual(['Paciente', 'Acompanhante'])
    cleanup()

    renderRoute('/admin/users?tenant=company&role=admin')
    await user.click(screen.getByRole('button', { name: /Nova pessoa/ }))
    const tiposEmpresa = Array.from((screen.getByLabelText('Tipo') as HTMLSelectElement).options).map((option) => option.text)
    expect(tiposEmpresa).toEqual(['Funcionário', 'Visitante'])
  })

  it('mostra no formulário o erro devolvido pela API', async () => {
    createUser.mockRejectedValueOnce(new Error('Já existe uma pessoa com o documento 123 neste cliente.'))
    const user = userEvent.setup()
    renderRoute('/admin/users?tenant=shopping&role=admin')
    await user.click(screen.getByRole('button', { name: /Nova pessoa/ }))
    await user.type(screen.getByLabelText('Nome'), 'Teste')
    await user.type(screen.getByLabelText('Documento'), '123')
    await user.click(screen.getByRole('button', { name: 'Salvar pessoa' }))
    expect(await screen.findByText(/Já existe uma pessoa/)).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('a rota exige a permissão users: admin e operador acessam, motorista não', async () => {
    renderRoute('/admin/users?tenant=shopping&role=driver')
    expect(screen.getByText(/Motorista não possui permissão/)).toBeInTheDocument()
    cleanup()

    renderRoute('/admin/users?tenant=shopping&role=operator')
    expect(screen.getByRole('heading', { name: 'Pessoas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Pessoas/ })).toBeInTheDocument() // item no menu
  })
})

describe('vagas', () => {
  const tiposDoFormulario = () => Array.from((screen.getByLabelText('Tipo') as HTMLSelectElement).options).map((option) => option.text)

  it('lista as vagas do tenant vindas da API, com o requisito da subclasse', async () => {
    renderRoute('/admin/spaces?tenant=shopping&role=admin')
    expect(await screen.findByText('A-01')).toBeInTheDocument()
    expect(screen.getByText('Exige credencial PCD visível no veículo')).toBeInTheDocument()
    expect(screen.getByText('3 registros visíveis')).toBeInTheDocument()
    expect(listSpaces).toHaveBeenCalledWith('shopping')
  })

  it('o filtro de setor usa os setores reais e continua funcionando', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/spaces?tenant=shopping&role=admin')
    await screen.findByText('A-01')
    const setores = Array.from((screen.getByLabelText('Filtrar por setor') as HTMLSelectElement).options).map((option) => option.text)
    expect(setores).toEqual(['Todos', 'A', 'B'])
    await user.selectOptions(screen.getByLabelText('Filtrar por setor'), 'B')
    expect(screen.getByText('1 registros visíveis')).toBeInTheDocument()
    expect(screen.queryByText('A-01')).not.toBeInTheDocument()
  })

  it('cadastra uma vaga', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/spaces?tenant=shopping&role=admin')
    await user.click(screen.getByRole('button', { name: /Nova vaga/ }))
    await user.type(screen.getByLabelText('Código'), 'C-30')
    await user.type(screen.getByLabelText('Setor'), 'C')
    await user.selectOptions(screen.getByLabelText('Tipo'), 'Elétrico')
    await user.click(screen.getByRole('button', { name: 'Salvar vaga' }))
    expect(await screen.findByText('Vaga C-30 cadastrada com sucesso.')).toBeInTheDocument()
    expect(createSpace).toHaveBeenCalledWith('shopping', { code: 'C-30', sector: 'C', type: 'Elétrico', status: 'Livre' })
  })

  it('edita código, setor, tipo e status', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/spaces?tenant=shopping&role=admin')
    await user.click(await screen.findByRole('button', { name: 'Editar vaga A-01' }))
    await user.clear(screen.getByLabelText('Código'))
    await user.type(screen.getByLabelText('Código'), 'A-10')
    await user.selectOptions(screen.getByLabelText('Tipo'), 'PCD')
    await user.selectOptions(screen.getByLabelText('Status'), 'Bloqueada')
    await user.click(screen.getByRole('button', { name: 'Salvar vaga' }))
    expect(await screen.findByText('Vaga A-10 atualizada com sucesso.')).toBeInTheDocument()
    expect(updateSpace).toHaveBeenCalledWith('shopping', '1', { code: 'A-10', sector: 'A', type: 'PCD', status: 'Bloqueada' })
  })

  it('exclui uma vaga livre', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/spaces?tenant=shopping&role=admin')
    await user.click(await screen.findByRole('button', { name: 'Excluir vaga A-01' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(await screen.findByText('Vaga excluída.')).toBeInTheDocument()
    expect(screen.queryByText('A-01')).not.toBeInTheDocument()
    expect(deleteSpace).toHaveBeenCalledWith('shopping', '1')
  })

  it('mostra o erro da API ao tentar excluir uma vaga ocupada', async () => {
    deleteSpace.mockRejectedValueOnce(new Error('A vaga A-02 está Ocupada e não pode ser excluída. Libere ou bloqueie a vaga antes.'))
    const user = userEvent.setup()
    renderRoute('/admin/spaces?tenant=shopping&role=admin')
    await user.click(await screen.findByRole('button', { name: 'Excluir vaga A-02' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(await screen.findByText(/A vaga A-02 está Ocupada/)).toBeInTheDocument()
    expect(screen.getByText('A-02')).toBeInTheDocument() // continua na lista
  })

  it('ao trocar de tenant, carrega as vagas do novo tenant', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/spaces?tenant=shopping&role=admin')
    expect(await screen.findByText('A-01')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Trocar contexto/ }))
    await user.click(screen.getByRole('button', { name: /Santa Clara/ }))
    await user.click(screen.getByRole('button', { name: /Entrar como Administrador/ }))
    await user.click(await screen.findByRole('link', { name: /Vagas e setores/ }))

    expect(await screen.findByText('P-01')).toBeInTheDocument()
    expect(screen.queryByText('A-01')).not.toBeInTheDocument()
    expect(listSpaces).toHaveBeenLastCalledWith('hospital')
  })

  it('o formulário oferece somente os spaceTypes de cada tenant', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/spaces?tenant=hospital&role=admin')
    await user.click(screen.getByRole('button', { name: /Nova vaga/ }))
    expect(tiposDoFormulario()).toEqual(['Prioritária', 'Comum', 'PCD'])
    cleanup()

    renderRoute('/admin/spaces?tenant=condominium&role=admin')
    await user.click(screen.getByRole('button', { name: /Nova vaga/ }))
    expect(tiposDoFormulario()).toEqual(['Nominal', 'Comum', 'PCD'])
    cleanup()

    renderRoute('/admin/spaces?tenant=shopping&role=admin')
    await user.click(screen.getByRole('button', { name: /Nova vaga/ }))
    expect(tiposDoFormulario()).toEqual(['Comum', 'PCD', 'Elétrico'])
    expect(tiposDoFormulario()).not.toContain('Prioritária')
    expect(tiposDoFormulario()).not.toContain('Nominal')
  })
})

describe('acessos (entradas e saídas)', () => {
  it('lista os acessos do tenant vindos da API, com status e motivo', async () => {
    renderRoute('/admin/access?tenant=shopping&role=admin')
    expect(await screen.findByText('BRA2E19')).toBeInTheDocument()
    expect(screen.getByText('Placa sem cadastro')).toBeInTheDocument()
    expect(screen.getByText('3 acessos exibidos')).toBeInTheDocument()
    expect(listAccess).toHaveBeenCalledWith('shopping')
  })

  it('registra uma liberação manual com o método do tenant', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/access?tenant=company&role=operator')
    await user.click(screen.getByRole('button', { name: /Liberação manual/ }))
    await user.type(screen.getByLabelText('Nome do usuário'), 'Ana Prado')
    await user.type(screen.getByLabelText('Tag RFID'), 'RF-55555')
    await user.selectOptions(screen.getByLabelText('Movimento'), 'Saída')
    await user.click(screen.getByRole('button', { name: 'Confirmar liberação' }))
    expect(await screen.findByText('Saída de Ana Prado liberada manualmente.')).toBeInTheDocument()
    expect(screen.getByText('RF-55555')).toBeInTheDocument()
    expect(createAccess).toHaveBeenCalledWith('company', { person: 'Ana Prado', identifier: 'RF-55555', direction: 'Saída', status: 'Liberado', denialReason: '', method: 'RFID' })
  })

  it('edita um acesso pendente e o nega com motivo', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/access?tenant=shopping&role=admin')
    await user.click(await screen.findByRole('button', { name: 'Editar acesso de Bruno Dias' }))
    await user.selectOptions(screen.getByLabelText('Status'), 'Negado')
    await user.type(screen.getByLabelText('Motivo da negação'), 'Veículo não autorizado')
    await user.click(screen.getByRole('button', { name: 'Salvar acesso' }))
    expect(await screen.findByText('Acesso de Bruno Dias atualizado.')).toBeInTheDocument()
    expect(screen.getByText('Veículo não autorizado')).toBeInTheDocument()
    expect(updateAccess).toHaveBeenCalledWith('shopping', '2', expect.objectContaining({ status: 'Negado', denialReason: 'Veículo não autorizado', method: 'LPR' }))
  })

  it('não deixa mudar o status de um acesso já decidido', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/access?tenant=shopping&role=admin')
    await user.click(await screen.findByRole('button', { name: 'Editar acesso de Marina Costa' }))
    expect(screen.getByLabelText(/^Status/)).toBeDisabled()
    expect(screen.getByText('Acesso já liberado: o status não pode mais mudar.')).toBeInTheDocument()
  })

  it('exclui um registro de acesso', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/access?tenant=shopping&role=admin')
    await user.click(await screen.findByRole('button', { name: 'Excluir acesso de Marina Costa' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(await screen.findByText('Registro de acesso excluído.')).toBeInTheDocument()
    expect(screen.queryByText('BRA2E19')).not.toBeInTheDocument()
    expect(deleteAccess).toHaveBeenCalledWith('shopping', '1')
  })

  it('mostra o erro devolvido pela API', async () => {
    updateAccess.mockRejectedValueOnce(new Error('Informe o motivo da negação.'))
    const user = userEvent.setup()
    renderRoute('/admin/access?tenant=shopping&role=admin')
    await user.click(await screen.findByRole('button', { name: 'Editar acesso de Bruno Dias' }))
    await user.click(screen.getByRole('button', { name: 'Salvar acesso' }))
    expect(await screen.findByText('Informe o motivo da negação.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('ao trocar de tenant, carrega os acessos do novo tenant', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/access?tenant=shopping&role=admin')
    expect(await screen.findByText('BRA2E19')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Trocar contexto/ }))
    await user.click(screen.getByRole('button', { name: /Horizonte/ }))
    await user.click(screen.getByRole('button', { name: /Entrar como Administrador/ }))
    await user.click(await screen.findByRole('link', { name: /Entradas e saídas/ }))

    expect(await screen.findByText('QR-4839-221')).toBeInTheDocument()
    expect(screen.queryByText('BRA2E19')).not.toBeInTheDocument()
    expect(listAccess).toHaveBeenLastCalledWith('condominium')
  })

  it('o identificador muda conforme o accessMethod do tenant', async () => {
    const user = userEvent.setup()
    const rotuloDoIdentificador = async (tenant: string) => {
      renderRoute(`/admin/access?tenant=${tenant}&role=admin`)
      await user.click(screen.getByRole('button', { name: /Liberação manual/ }))
      const rotulos = Array.from(screen.getByRole('dialog').querySelectorAll('.form-field > span')).map((span) => span.textContent)
      cleanup()
      return rotulos[1]
    }
    expect(await rotuloDoIdentificador('shopping')).toBe('Placa / LPR')
    expect(await rotuloDoIdentificador('condominium')).toBe('Código QR')
    expect(await rotuloDoIdentificador('company')).toBe('Tag RFID')
  })

  it('o dashboard mostra a atividade recente com os acessos do banco', async () => {
    renderRoute('/admin/dashboard?tenant=hospital&role=admin')
    expect(await screen.findByText('Helena Moreira')).toBeInTheDocument()
    expect(listAccess).toHaveBeenCalledWith('hospital')
  })
})

describe('tarifas', () => {
  const linhaDa = (nome: string) => screen.getByText(nome).closest('tr') as HTMLElement

  it('lista as tarifas com a simulação de 3h feita pela Strategy', async () => {
    renderRoute('/admin/tariffs?tenant=shopping&role=admin')
    expect(await screen.findByText('Tarifa Aurora')).toBeInTheDocument()
    expect(within(linhaDa('Tarifa Aurora')).getByText('R$ 36,00')).toBeInTheDocument() // 3 × R$ 12
    expect(within(linhaDa('Tarifa Aurora')).getByText('R$ 12,00/hora (máx. R$ 60,00/dia)')).toBeInTheDocument()
    expect(within(linhaDa('Diária promocional')).getByText('R$ 40,00')).toBeInTheDocument() // 1 diária
    expect(within(linhaDa('Cortesia para lojistas')).getByText('R$ 0,00')).toBeInTheDocument() // isenta
    expect(within(linhaDa('Tarifa Aurora')).getByText('Ativa')).toBeInTheDocument()
    expect(listTariffs).toHaveBeenCalledWith('shopping')
  })

  it('cadastra uma tarifa por hora com teto', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/tariffs?tenant=shopping&role=admin')
    await user.click(screen.getByRole('button', { name: /Nova tarifa/ }))
    await user.type(screen.getByLabelText('Nome'), 'Noturna')
    await user.type(screen.getByLabelText('Valor da hora (R$)'), '8')
    await user.type(screen.getByLabelText(/Teto diário/), '30')
    await user.click(screen.getByRole('button', { name: 'Salvar tarifa' }))
    expect(await screen.findByText('Tarifa Noturna cadastrada com sucesso.')).toBeInTheDocument()
    expect(within(linhaDa('Noturna')).getByText('R$ 24,00')).toBeInTheDocument()
    expect(createTariff).toHaveBeenCalledWith('shopping', { name: 'Noturna', strategy: 'POR_HORA', value: 8, maxDaily: 30, active: false })
  })

  it('o formulário mostra só os campos de cada Strategy', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/tariffs?tenant=shopping&role=admin')
    await user.click(screen.getByRole('button', { name: /Nova tarifa/ }))
    expect(screen.getByLabelText(/Teto diário/)).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Tipo de cálculo'), 'DIARIA')
    expect(screen.getByLabelText('Valor da diária (R$)')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Teto diário/)).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Tipo de cálculo'), 'ISENTA')
    expect(screen.queryByLabelText(/Valor/)).not.toBeInTheDocument()
  })

  it('edita uma tarifa trocando a Strategy', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/tariffs?tenant=shopping&role=admin')
    await user.click(await screen.findByRole('button', { name: 'Editar Diária promocional' }))
    await user.selectOptions(screen.getByLabelText('Tipo de cálculo'), 'POR_HORA')
    await user.clear(screen.getByLabelText('Valor da hora (R$)'))
    await user.type(screen.getByLabelText('Valor da hora (R$)'), '5')
    await user.click(screen.getByRole('button', { name: 'Salvar tarifa' }))
    expect(await screen.findByText('Tarifa Diária promocional atualizada com sucesso.')).toBeInTheDocument()
    expect(within(linhaDa('Diária promocional')).getByText('R$ 15,00')).toBeInTheDocument()
    expect(updateTariff).toHaveBeenCalledWith('shopping', '3', { name: 'Diária promocional', strategy: 'POR_HORA', value: 5, maxDaily: null, active: false })
  })

  it('ativar uma tarifa desativa a anterior', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/tariffs?tenant=shopping&role=admin')
    await user.click(await screen.findByRole('button', { name: 'Ativar Diária promocional' }))
    expect(await screen.findByText('Tarifa Diária promocional ativada. A anterior foi desativada.')).toBeInTheDocument()
    expect(within(linhaDa('Diária promocional')).getByText('Ativa')).toBeInTheDocument()
    expect(within(linhaDa('Tarifa Aurora')).getByText('Inativa')).toBeInTheDocument()
    expect(updateTariff).toHaveBeenCalledWith('shopping', '3', expect.objectContaining({ active: true }))
  })

  it('exclui uma tarifa inativa', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/tariffs?tenant=shopping&role=admin')
    await user.click(await screen.findByRole('button', { name: 'Excluir Cortesia para lojistas' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(await screen.findByText('Tarifa excluída.')).toBeInTheDocument()
    expect(screen.queryByText('Cortesia para lojistas')).not.toBeInTheDocument()
    expect(deleteTariff).toHaveBeenCalledWith('shopping', '4')
  })

  it('mostra o erro da API ao excluir a tarifa ativa', async () => {
    deleteTariff.mockRejectedValueOnce(new Error('A tarifa Tarifa Aurora está ativa. Ative outra tarifa ou desative esta antes de excluir.'))
    const user = userEvent.setup()
    renderRoute('/admin/tariffs?tenant=shopping&role=admin')
    await user.click(await screen.findByRole('button', { name: 'Excluir Tarifa Aurora' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(await screen.findByText(/está ativa/)).toBeInTheDocument()
    expect(screen.getByText('Tarifa Aurora')).toBeInTheDocument()
  })

  it('ao trocar de tenant, carrega as tarifas do novo tenant', async () => {
    const user = userEvent.setup()
    renderRoute('/admin/tariffs?tenant=shopping&role=admin')
    expect(await screen.findByText('Tarifa Aurora')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Trocar contexto/ }))
    await user.click(screen.getByRole('button', { name: /Santa Clara/ }))
    await user.click(screen.getByRole('button', { name: /Entrar como Administrador/ }))
    await user.click(await screen.findByRole('link', { name: /Tarifas/ }))

    expect(await screen.findByText('Tarifa Santa Clara')).toBeInTheDocument()
    expect(screen.queryByText('Tarifa Aurora')).not.toBeInTheDocument()
    expect(listTariffs).toHaveBeenLastCalledWith('hospital')
  })

  it('Shopping e Hospital acessam; Condomínio e Empresa são bloqueados por billing', () => {
    renderRoute('/admin/tariffs?tenant=hospital&role=admin')
    expect(screen.getByRole('heading', { name: 'Tarifas' })).toBeInTheDocument()
    cleanup()

    renderRoute('/admin/tariffs?tenant=condominium&role=admin')
    expect(screen.getByText(/Cobrança individual não está disponível para Residencial Horizonte/)).toBeInTheDocument()
    cleanup()

    renderRoute('/admin/tariffs?tenant=company&role=admin')
    expect(screen.getByText(/Cobrança individual não está disponível para Nexora Tecnologia/)).toBeInTheDocument()
    expect(listTariffs).not.toHaveBeenCalledWith('condominium')
    expect(listTariffs).not.toHaveBeenCalledWith('company')
  })

  it('o menu só mostra Tarifas quando billing está ligado', () => {
    renderRoute('/admin/dashboard?tenant=shopping&role=admin')
    expect(screen.getByRole('link', { name: /Tarifas/ })).toBeInTheDocument()
    cleanup()

    renderRoute('/admin/dashboard?tenant=condominium&role=admin')
    expect(screen.queryByRole('link', { name: /Tarifas/ })).not.toBeInTheDocument()
  })
})

describe('reservas', () => {
  const linhaDa = (vaga: string) => within(screen.getByRole('table')).getByText(vaga).closest('tr') as HTMLElement

  it('a rota principal e o alias /new abrem a mesma página com as reservas do banco', async () => {
    renderRoute('/app/reservations?tenant=shopping&role=driver')
    expect(await screen.findByText('A-03')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Minhas reservas' })).toBeInTheDocument()
    cleanup()

    renderRoute('/app/reservations/new?tenant=shopping&role=driver')
    expect(await screen.findByText('A-03')).toBeInTheDocument()
    expect(listReservations).toHaveBeenCalledWith('shopping')
  })

  it('lista as reservas com status; só as ativas podem ser editadas ou canceladas', async () => {
    renderRoute('/app/reservations?tenant=shopping&role=driver')
    await screen.findByText('A-03')
    expect(within(linhaDa('A-03')).getByText('Confirmada')).toBeInTheDocument()
    expect(within(linhaDa('B-11')).getByText('Cancelada')).toBeInTheDocument()
    expect(within(linhaDa('A-03')).getByText('R$ 24,00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar reserva da vaga A-03' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar reserva da vaga B-11' })).not.toBeInTheDocument()
  })

  it('a estimativa vem da tarifa ativa (Strategy), inclusive o teto diário', async () => {
    const user = userEvent.setup()
    renderRoute('/app/reservations?tenant=shopping&role=driver')
    expect(await screen.findByText('R$ 24,00', { selector: '.estimate strong' })).toBeInTheDocument() // 2h × R$ 12
    expect(screen.getByText(/Estimativa da reserva · Tarifa Aurora/)).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Período'), '8')
    expect(screen.getByText('R$ 60,00', { selector: '.estimate strong' })).toBeInTheDocument() // 8h × 12 = 96, limitado ao teto de R$ 60
  })

  it('cria uma reserva só com vagas livres e mostra a notificação do Observer', async () => {
    const user = userEvent.setup()
    renderRoute('/app/reservations?tenant=shopping&role=driver')
    await screen.findByText('A-03')
    const vagas = Array.from((screen.getByLabelText('Vaga') as HTMLSelectElement).options).map((option) => option.text)
    expect(vagas).toEqual(['A-01 · Comum', 'B-13 · Elétrico']) // A-02 está Ocupada
    await user.selectOptions(screen.getByLabelText('Vaga'), '3')
    await user.click(screen.getByRole('button', { name: /Confirmar reserva/ }))
    expect(await screen.findByText('Sua vaga está garantida.')).toBeInTheDocument()
    expect(screen.getByText('Reserva confirmada para a vaga B-13.')).toBeInTheDocument()
    expect(createReservation).toHaveBeenCalledWith('shopping', expect.objectContaining({ vehicleId: '1', spaceId: '3', time: '18:30', duration: 2 }))
  })

  it('mostra o erro da API quando a vaga não está disponível', async () => {
    createReservation.mockRejectedValueOnce(new Error('A vaga A-01 não está livre para reserva (status: Ocupada).'))
    const user = userEvent.setup()
    renderRoute('/app/reservations?tenant=shopping&role=driver')
    await screen.findByText('A-03')
    await user.click(screen.getByRole('button', { name: /Confirmar reserva/ }))
    expect(await screen.findByText(/não está livre para reserva/)).toBeInTheDocument()
  })

  it('edita data, horário e duração de uma reserva ativa', async () => {
    const user = userEvent.setup()
    renderRoute('/app/reservations?tenant=shopping&role=driver')
    await user.click(await screen.findByRole('button', { name: 'Editar reserva da vaga A-03' }))
    const modal = within(screen.getByRole('dialog'))
    await user.selectOptions(modal.getByLabelText('Período'), '4')
    expect(modal.getByText('R$ 48,00')).toBeInTheDocument() // prévia pela Strategy
    await user.click(modal.getByRole('button', { name: 'Salvar alteração' }))
    expect(await screen.findByText('Nova data: 2026-10-07 às 18:30, por 4h.')).toBeInTheDocument()
    expect(updateReservation).toHaveBeenCalledWith('shopping', '1', { date: '2026-10-07', time: '18:30', duration: 4 })
  })

  it('cancela uma reserva confirmada', async () => {
    const user = userEvent.setup()
    renderRoute('/app/reservations?tenant=shopping&role=driver')
    await user.click(await screen.findByRole('button', { name: 'Cancelar reserva da vaga A-03' }))
    expect(await screen.findByText('Reserva cancelada. A vaga A-03 foi liberada.')).toBeInTheDocument()
    expect(within(linhaDa('A-03')).getByText('Cancelada')).toBeInTheDocument()
    expect(cancelReservation).toHaveBeenCalledWith('shopping', '1')
  })

  it('exclui uma reserva cancelada', async () => {
    const user = userEvent.setup()
    renderRoute('/app/reservations?tenant=shopping&role=driver')
    await user.click(await screen.findByRole('button', { name: 'Excluir reserva da vaga B-11' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(await screen.findByText('Reserva excluída.')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).queryByText('B-11')).not.toBeInTheDocument()
    expect(deleteReservation).toHaveBeenCalledWith('shopping', '2')
  })

  it('mostra o erro da API ao tentar excluir uma reserva ativa', async () => {
    deleteReservation.mockRejectedValueOnce(new Error('Cancele a reserva antes de excluir.'))
    const user = userEvent.setup()
    renderRoute('/app/reservations?tenant=shopping&role=driver')
    await user.click(await screen.findByRole('button', { name: 'Excluir reserva da vaga A-03' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(await screen.findByText('Cancele a reserva antes de excluir.')).toBeInTheDocument()
    expect(within(linhaDa('A-03')).getByText('Confirmada')).toBeInTheDocument()
  })

  it('ao trocar para um tenant sem reservation, o menu e a tela somem', async () => {
    const user = userEvent.setup()
    renderRoute('/app/reservations?tenant=shopping&role=driver')
    expect(await screen.findByText('A-03')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Reservar/ })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Trocar perfil/ }))
    await user.click(screen.getByRole('button', { name: /Santa Clara/ }))
    await user.click(screen.getByRole('button', { name: /Entrar como Motorista/ }))

    expect(await screen.findByText(/Acesso acolhedor e sem demora/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Reservar/ })).not.toBeInTheDocument()
    expect(listReservations).not.toHaveBeenCalledWith('hospital')
  })

  it('bloqueia a rota principal quando reservation=false', () => {
    renderRoute('/app/reservations?tenant=hospital&role=driver')
    expect(screen.getByText(/Reserva não está disponível para Hospital Santa Clara/)).toBeInTheDocument()
    expect(listReservations).not.toHaveBeenCalled()
  })
})
