import { describe, expect, it } from 'vitest'
import { TENANTS } from '../../../core/config'
import {
  Convenio, TarifaComConvenio, TarifaIsenta, TarifaPorHora, VagaComum, VagaNominal, VagaPrioritaria,
  VarianteCondominio, VarianteEmpresa, VarianteHospital, VarianteShopping, type VarianteSmartPark,
} from '../..'

const variantes: VarianteSmartPark[] = [new VarianteShopping(), new VarianteHospital(), new VarianteCondominio(), new VarianteEmpresa()]

describe('Factory Method — Exemplo 2: variantes da Linha de Produto', () => {
  it('as quatro variantes usam o mesmo contrato, mas criam estratégias de tarifa diferentes', () => {
    const estrategias = variantes.map((variante) => variante.criarEstrategiaTarifa())
    expect(estrategias[0]).toBeInstanceOf(TarifaPorHora) // Shopping
    expect(estrategias[1]).toBeInstanceOf(TarifaPorHora) // Hospital (sem convênio)
    expect(estrategias[2]).toBeInstanceOf(TarifaIsenta) // Condomínio
    expect(estrategias[3]).toBeInstanceOf(TarifaIsenta) // Empresa
  })

  it('as quatro variantes usam o mesmo contrato, mas criam vagas padrão diferentes', () => {
    const vagas = variantes.map((variante) => variante.criarVagaPadrao('v-1', 'X-01', 'X'))
    expect(vagas[0]).toBeInstanceOf(VagaComum)
    expect(vagas[1]).toBeInstanceOf(VagaPrioritaria)
    expect(vagas[2]).toBeInstanceOf(VagaNominal)
    expect(vagas[3]).toBeInstanceOf(VagaComum)
  })

  it('criarTarifa monta uma Tarifa com a estratégia escolhida pela variante', () => {
    const valores = variantes.map((variante) => variante.criarTarifa('t-1').calcular(3))
    expect(valores).toEqual([36, 30, 0, 0])
    expect(new VarianteShopping().criarTarifa('t-1').descricao()).toBe('Tarifa Aurora: R$ 12,00/hora (máx. R$ 60,00/dia)')
  })

  it('a configuração vem de TENANTS, sem cópia', () => {
    expect(new VarianteHospital().configuracao()).toBe(TENANTS.hospital)
    expect(new VarianteCondominio().configuracao()).toBe(TENANTS.condominium)
  })

  it('a tarifa criada é coerente com a flag billing de cada tenant', () => {
    variantes.forEach((variante) => {
      const cobra = variante.criarTarifa('t-1').calcular(2) > 0
      expect(cobra).toBe(variante.possuiFeature('billing'))
    })
  })
})

describe('Factory Method — variabilidade do Convênio Médico', () => {
  const convenio = new Convenio('c-1', 'Saúde Plena', 'isencao')

  it('Hospital tem medicalAgreement ligado em TENANTS e cria uma tarifa com convênio', () => {
    const hospital = new VarianteHospital()
    expect(TENANTS.hospital.features.medicalAgreement).toBe(true)
    expect(hospital.possuiFeature('medicalAgreement')).toBe(true)

    const estrategia = hospital.criarEstrategiaTarifa(convenio)
    expect(estrategia).toBeInstanceOf(TarifaComConvenio)
    expect(hospital.criarTarifa('t-1', convenio).calcular(3)).toBe(0)
  })

  it('Shopping tem medicalAgreement desligado e ignora o convênio', () => {
    const shopping: VarianteSmartPark = new VarianteShopping()
    expect(TENANTS.shopping.features.medicalAgreement).toBe(false)

    const estrategia = shopping.criarEstrategiaTarifa(convenio)
    expect(estrategia).toBeInstanceOf(TarifaPorHora)
    expect(shopping.criarTarifa('t-1', convenio).calcular(3)).toBe(36)
  })

  it('a vaga padrão do Hospital é a prioritária para pacientes', () => {
    const vaga = new VarianteHospital().criarVagaPadrao('h-1', 'H-01', 'H')
    expect(vaga.tipo).toBe('Prioritária')
    expect(vaga.requisitoDeUso()).toBe('Exclusiva para pacientes e acompanhantes')
  })
})
