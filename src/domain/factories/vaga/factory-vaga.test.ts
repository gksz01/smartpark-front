import { describe, expect, it } from 'vitest'
import { TENANT_ORDER, TENANTS } from '../../../core/config'
import {
  CRIADOR_POR_TIPO, CriadorVagaComum, CriadorVagaEletrica, CriadorVagaNominal, CriadorVagaPCD, CriadorVagaPrioritaria, CriadorVagaRestrita, Estacionamento, Vaga,
  VagaComum, VagaEletrica, VagaNominal, VagaPCD, VagaPrioritaria, VagaRestrita, type CriadorVaga,
} from '../..'

describe('Factory Method — Exemplo 1: criação de vagas', () => {
  it('cada Creator concreto cria a sua subclasse de Vaga', () => {
    expect(new CriadorVagaComum().criarVaga('1', 'A-01', 'A')).toBeInstanceOf(VagaComum)
    expect(new CriadorVagaPCD().criarVaga('2', 'A-02', 'A')).toBeInstanceOf(VagaPCD)
    expect(new CriadorVagaEletrica().criarVaga('3', 'C-21', 'C')).toBeInstanceOf(VagaEletrica)
    expect(new CriadorVagaPrioritaria().criarVaga('4', 'H-01', 'H')).toBeInstanceOf(VagaPrioritaria)
    expect(new CriadorVagaNominal().criarVaga('5', 'B-12', 'B')).toBeInstanceOf(VagaNominal)
  })

  it('o produto já nasce com o tipo correto e continua sendo uma Vaga', () => {
    const vaga = new CriadorVagaPCD().criarVaga('2', 'A-02', 'A')
    expect(vaga).toBeInstanceOf(Vaga)
    expect(vaga.tipo).toBe('PCD')
    expect(vaga.estaDisponivel()).toBe(true)
  })

  it('os produtos têm comportamentos diferentes', () => {
    const comum = new CriadorVagaComum().criarVaga('1', 'A-01', 'A')
    const eletrica = new CriadorVagaEletrica().criarVaga('3', 'C-21', 'C')
    const prioritaria = new CriadorVagaPrioritaria().criarVaga('4', 'H-01', 'H')

    expect(comum.requisitoDeUso()).toBe('Livre para qualquer veículo')
    expect(eletrica.requisitoDeUso()).toBe('Exclusiva para veículos elétricos em recarga')
    expect(prioritaria.requisitoDeUso()).toBe('Exclusiva para pacientes e acompanhantes')

    // 5 horas: sem limite na comum, excede as 4h de recarga da elétrica, dentro das 6h da prioritária.
    expect(comum.excedeuPermanencia(5)).toBe(false)
    expect(eletrica.excedeuPermanencia(5)).toBe(true)
    expect(prioritaria.excedeuPermanencia(5)).toBe(false)
  })

  it('a operação cadastrarVaga funciona com qualquer Creator, sem conhecer o tipo concreto', () => {
    const estacionamento = new Estacionamento('central', 'Estacionamento Central', 'Av. das Palmeiras, 450')
    const criadores: CriadorVaga[] = [new CriadorVagaComum(), new CriadorVagaPCD(), new CriadorVagaEletrica()]

    criadores.forEach((criador, indice) => criador.cadastrarVaga(estacionamento, `v-${indice}`, `A-0${indice + 1}`, 'A'))

    expect(estacionamento.totalVagas()).toBe(3)
    expect(estacionamento.vagas.map((vaga) => vaga.tipo)).toEqual(['Comum', 'PCD', 'Elétrico'])
    expect(estacionamento.buscarVagaLivre('Elétrico')?.codigo).toBe('A-03')
  })
})

describe('Factory Method — Creator escolhido pelo tipo (usado pela API de vagas)', () => {
  it('CriadorVagaRestrita cria uma VagaRestrita', () => {
    const vaga = new CriadorVagaRestrita().criarVaga('7', 'D-01', 'Diretoria')
    expect(vaga).toBeInstanceOf(VagaRestrita)
    expect(vaga.tipo).toBe('Restrito')
    expect(vaga.requisitoDeUso()).toBe('Exclusiva para credenciais autorizadas')
  })

  it('CRIADOR_POR_TIPO devolve o Creator que cria a subclasse correta', () => {
    expect(CRIADOR_POR_TIPO['Comum'].criarVaga('1', 'X', 'A')).toBeInstanceOf(VagaComum)
    expect(CRIADOR_POR_TIPO['PCD'].criarVaga('1', 'X', 'A')).toBeInstanceOf(VagaPCD)
    expect(CRIADOR_POR_TIPO['Elétrico'].criarVaga('1', 'X', 'A')).toBeInstanceOf(VagaEletrica)
    expect(CRIADOR_POR_TIPO['Nominal'].criarVaga('1', 'X', 'A')).toBeInstanceOf(VagaNominal)
    expect(CRIADOR_POR_TIPO['Restrito'].criarVaga('1', 'X', 'A')).toBeInstanceOf(VagaRestrita)
    expect(CRIADOR_POR_TIPO['Prioritária'].criarVaga('1', 'X', 'A')).toBeInstanceOf(VagaPrioritaria)
  })

  it('todo tipo do spaceTypes de cada tenant tem um Creator', () => {
    TENANT_ORDER.forEach((id) => {
      TENANTS[id].spaceTypes.forEach((tipo) => {
        expect(CRIADOR_POR_TIPO[tipo].criarVaga('1', 'X', 'A').tipo).toBe(tipo)
      })
    })
  })

  it('só vagas Livres ou Bloqueadas podem ser excluídas', () => {
    expect(new VagaComum('1', 'A', 'A', 'Livre').podeSerExcluida()).toBe(true)
    expect(new VagaComum('1', 'A', 'A', 'Bloqueada').podeSerExcluida()).toBe(true)
    expect(new VagaComum('1', 'A', 'A', 'Ocupada').podeSerExcluida()).toBe(false)
    expect(new VagaComum('1', 'A', 'A', 'Reservada').podeSerExcluida()).toBe(false)
  })
})
