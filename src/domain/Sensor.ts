/**
 * Sensor instalado em uma vaga que detecta a presença de um veículo.
 * No protótipo as leituras são simuladas, mas as regras são as mesmas de um sensor real.
 */
export class Sensor {
  id: string
  codigo: string
  vagaId: string
  ativo: boolean
  ocupado: boolean
  ultimaLeitura: Date | null

  constructor(id: string, codigo: string, vagaId: string, ativo = true) {
    this.id = id
    this.codigo = codigo
    this.vagaId = vagaId
    this.ativo = ativo
    this.ocupado = false
    this.ultimaLeitura = null
  }

  /** Registra que um veículo foi detectado. Retorna true se o estado mudou. */
  detectarOcupacao(momento: Date = new Date()): boolean {
    return this.registrarLeitura(true, momento)
  }

  /** Registra que a vaga ficou vazia. Retorna true se o estado mudou. */
  detectarLiberacao(momento: Date = new Date()): boolean {
    return this.registrarLeitura(false, momento)
  }

  ativar(): void {
    this.ativo = true
  }

  desativar(): void {
    this.ativo = false
  }

  private registrarLeitura(ocupado: boolean, momento: Date): boolean {
    if (!this.ativo) {
      throw new Error(`O sensor ${this.codigo} está desativado.`)
    }
    const mudou = this.ocupado !== ocupado
    this.ocupado = ocupado
    this.ultimaLeitura = momento
    return mudou
  }
}
