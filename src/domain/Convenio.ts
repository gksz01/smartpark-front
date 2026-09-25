import type { Tarifa } from './Tarifa'

export type TipoBeneficio = 'isencao' | 'percentual' | 'horasGratis'

/**
 * Convênio médico que concede benefício no estacionamento do Hospital.
 * valorBeneficio é o percentual (tipo "percentual") ou a quantidade de horas (tipo "horasGratis").
 */
export class Convenio {
  id: string
  nome: string
  tipoBeneficio: TipoBeneficio
  valorBeneficio: number
  ativo: boolean

  constructor(id: string, nome: string, tipoBeneficio: TipoBeneficio, valorBeneficio = 0, ativo = true) {
    this.id = id
    this.nome = nome
    this.tipoBeneficio = tipoBeneficio
    this.valorBeneficio = valorBeneficio
    this.ativo = ativo
  }

  /** Valor final do estacionamento depois do benefício. */
  aplicarBeneficio(tarifa: Tarifa, duracaoHoras: number): number {
    if (!this.ativo) return tarifa.calcular(duracaoHoras)
    if (this.tipoBeneficio === 'isencao') return 0
    if (this.tipoBeneficio === 'percentual') return tarifa.calcular(duracaoHoras) * (1 - this.valorBeneficio / 100)
    return tarifa.calcular(Math.max(0, duracaoHoras - this.valorBeneficio))
  }

  /** Mesmos textos exibidos hoje no módulo de convênio. */
  descricaoBeneficio(): string {
    if (this.tipoBeneficio === 'isencao') return 'Isenção de 100%'
    if (this.tipoBeneficio === 'percentual') return `Desconto de ${this.valorBeneficio}%`
    return `${this.valorBeneficio} horas gratuitas`
  }
}
