import type { Convenio } from './Convenio'

const FORMATO_ATENDIMENTO = /^ATD-\d{5}$/ // Ex.: ATD-48291
const VALIDADE_HORAS = 24

/** Atendimento hospitalar de um paciente, usado para validar o benefício do convênio. */
export class Atendimento {
  id: string
  numero: string
  paciente: string
  convenio: Convenio
  dataAtendimento: Date
  beneficioAplicado: boolean

  constructor(id: string, numero: string, paciente: string, convenio: Convenio, dataAtendimento: Date = new Date()) {
    this.id = id
    this.numero = numero
    this.paciente = paciente
    this.convenio = convenio
    this.dataAtendimento = dataAtendimento
    this.beneficioAplicado = false
  }

  /**
   * Elegível quando: número no formato correto, convênio ativo,
   * atendimento nas últimas 24 horas e benefício ainda não utilizado.
   */
  validarElegibilidade(agora: Date = new Date()): boolean {
    const horasDesdeAtendimento = (agora.getTime() - this.dataAtendimento.getTime()) / (60 * 60 * 1000)
    return FORMATO_ATENDIMENTO.test(this.numero)
      && this.convenio.ativo
      && horasDesdeAtendimento >= 0
      && horasDesdeAtendimento <= VALIDADE_HORAS
      && !this.beneficioAplicado
  }

  /** Marca o benefício como utilizado, impedindo o uso duplicado. */
  aplicarBeneficio(agora: Date = new Date()): void {
    if (!this.validarElegibilidade(agora)) {
      throw new Error(`O atendimento ${this.numero} não está elegível para o benefício.`)
    }
    this.beneficioAplicado = true
  }
}
