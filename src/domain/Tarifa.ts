/**
 * Regra de preço do estacionamento.
 * Cobra por hora iniciada e respeita um teto diário opcional.
 */
export class Tarifa {
  id: string
  nome: string
  valorHora: number
  valorMaximoDiario?: number

  constructor(id: string, nome: string, valorHora: number, valorMaximoDiario?: number) {
    this.id = id
    this.nome = nome
    this.valorHora = valorHora
    this.valorMaximoDiario = valorMaximoDiario
  }

  /** Ex.: 2h10min são cobradas como 3 horas. */
  calcular(duracaoHoras: number): number {
    if (duracaoHoras <= 0) return 0
    const valor = Math.ceil(duracaoHoras) * this.valorHora
    if (this.valorMaximoDiario !== undefined) return Math.min(valor, this.valorMaximoDiario)
    return valor
  }

  descricao(): string {
    const texto = `${this.nome}: R$ ${this.valorHora.toFixed(2).replace('.', ',')}/hora`
    if (this.valorMaximoDiario === undefined) return texto
    return `${texto} (máx. R$ ${this.valorMaximoDiario.toFixed(2).replace('.', ',')}/dia)`
  }
}
