import { describe, expect, it } from 'vitest'
import { configuracaoDaEstrategia, Convenio, CRIAR_ESTRATEGIA, Reserva, Tarifa, TarifaComConvenio, TarifaFixaDiaria, TarifaIsenta, TarifaPorHora, type EstrategiaTarifa } from '../..'

describe('Strategy — Exemplo 1: cálculo de tarifa', () => {
  it('a mesma classe Tarifa calcula valores diferentes com estratégias diferentes', () => {
    const porHora = new Tarifa('t-1', 'Shopping', new TarifaPorHora(12))
    const diaria = new Tarifa('t-2', 'Mensalista', new TarifaFixaDiaria(40))
    const convenio = new Convenio('c-1', 'VidaCare', 'percentual', 50)
    const comConvenio = new Tarifa('t-3', 'Hospital', new TarifaComConvenio(new TarifaPorHora(12), convenio))

    // Mesma chamada, mesmo parâmetro (3 horas), resultados diferentes.
    expect(porHora.calcular(3)).toBe(36)
    expect(diaria.calcular(3)).toBe(40)
    expect(comConvenio.calcular(3)).toBe(18)
  })

  it('trocar a estratégia muda o resultado sem alterar a classe Tarifa', () => {
    const tarifa = new Tarifa('t-1', 'Estacionamento Central', new TarifaPorHora(12))
    expect(tarifa.calcular(5)).toBe(60)
    expect(tarifa.descricao()).toBe('Estacionamento Central: R$ 12,00/hora')

    tarifa.definirEstrategia(new TarifaFixaDiaria(40))
    expect(tarifa.calcular(5)).toBe(40)
    expect(tarifa.descricao()).toBe('Estacionamento Central: R$ 40,00/dia')
  })

  it('todas as estratégias cumprem o mesmo contrato EstrategiaTarifa', () => {
    const estrategias: EstrategiaTarifa[] = [
      new TarifaPorHora(10),
      new TarifaFixaDiaria(50),
      new TarifaComConvenio(new TarifaPorHora(10), new Convenio('c-1', 'Saúde Plena', 'isencao')),
    ]
    const resultados = estrategias.map((estrategia) => new Tarifa('t', 'Teste', estrategia).calcular(2))
    expect(resultados).toEqual([20, 50, 0])
  })

  it('TarifaFixaDiaria cobra por dia iniciado', () => {
    const diaria = new TarifaFixaDiaria(40)
    expect(diaria.calcular(0)).toBe(0)
    expect(diaria.calcular(24)).toBe(40)
    expect(diaria.calcular(30)).toBe(80)
  })

  it('TarifaComConvenio aplica o benefício sobre qualquer estratégia base', () => {
    const horasGratis = new Convenio('c-3', 'Bem Estar', 'horasGratis', 2)
    const sobrePorHora = new TarifaComConvenio(new TarifaPorHora(10), horasGratis)
    const sobreDiaria = new TarifaComConvenio(new TarifaFixaDiaria(40), new Convenio('c-2', 'VidaCare', 'percentual', 25))

    expect(sobrePorHora.calcular(3)).toBe(10)
    expect(sobreDiaria.calcular(3)).toBe(30)
    expect(sobrePorHora.descricao()).toBe('R$ 10,00/hora com convênio Bem Estar (2 horas gratuitas)')
  })

  it('a Reserva usa a Tarifa sem conhecer a estratégia concreta', () => {
    const reserva = new Reserva('r-1', 'v-1', 'A-03', '2026-09-05', '18:30', 4)
    expect(reserva.calcularEstimativa(new Tarifa('t-1', 'Por hora', new TarifaPorHora(12)))).toBe(48)
    expect(reserva.calcularEstimativa(new Tarifa('t-2', 'Diária', new TarifaFixaDiaria(40)))).toBe(40)
  })
})

describe('Strategy — tarifas gravadas no banco (tipo_estrategia → Strategy concreta)', () => {
  it('POR_HORA: a Tarifa delega o cálculo para uma TarifaPorHora', () => {
    const tarifa = new Tarifa('1', 'Shopping', CRIAR_ESTRATEGIA.POR_HORA({ tipo: 'POR_HORA', valor: 12, valorMaximoDiario: 60 }))
    expect(tarifa.estrategia).toBeInstanceOf(TarifaPorHora)
    expect(tarifa.calcular(3)).toBe(36)
  })

  it('DIARIA: a Tarifa delega o cálculo para uma TarifaFixaDiaria', () => {
    const tarifa = new Tarifa('2', 'Diária', CRIAR_ESTRATEGIA.DIARIA({ tipo: 'DIARIA', valor: 40, valorMaximoDiario: null }))
    expect(tarifa.estrategia).toBeInstanceOf(TarifaFixaDiaria)
    expect(tarifa.calcular(3)).toBe(40)
  })

  it('ISENTA: a Tarifa delega o cálculo para uma TarifaIsenta', () => {
    const tarifa = new Tarifa('3', 'Cortesia', CRIAR_ESTRATEGIA.ISENTA({ tipo: 'ISENTA', valor: 0, valorMaximoDiario: null }))
    expect(tarifa.estrategia).toBeInstanceOf(TarifaIsenta)
    expect(tarifa.calcular(3)).toBe(0)
  })

  it('o caminho inverso devolve a mesma configuração (ida e volta do banco)', () => {
    expect(configuracaoDaEstrategia(new TarifaPorHora(12, 60))).toEqual({ tipo: 'POR_HORA', valor: 12, valorMaximoDiario: 60 })
    expect(configuracaoDaEstrategia(new TarifaPorHora(9))).toEqual({ tipo: 'POR_HORA', valor: 9, valorMaximoDiario: null })
    expect(configuracaoDaEstrategia(new TarifaFixaDiaria(40))).toEqual({ tipo: 'DIARIA', valor: 40, valorMaximoDiario: null })
    expect(configuracaoDaEstrategia(new TarifaIsenta())).toEqual({ tipo: 'ISENTA', valor: 0, valorMaximoDiario: null })
  })

  it('TarifaComConvenio não é gravada como tarifa independente', () => {
    const comConvenio = new TarifaComConvenio(new TarifaPorHora(10), new Convenio('c-1', 'Saúde Plena', 'isencao'))
    expect(() => configuracaoDaEstrategia(comConvenio)).toThrow('não pode ser gravada')
  })
})
