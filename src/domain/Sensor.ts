import { Observable } from './observer/Observable'

/** Evento emitido pelo Sensor quando a presença de veículo muda. */
export interface EventoSensor {
  tipo: 'ocupada' | 'liberada'
  codigoSensor: string
  vagaId: string
  momento: Date
}

/**
 * Sensor instalado em uma vaga que detecta a presença de um veículo.
 * No protótipo as leituras são simuladas, mas as regras são as mesmas de um sensor real.
 *
 * OBSERVER — Exemplo 1: o Sensor é o Subject. Quando o estado muda,
 * ele notifica os observadores inscritos, sem conhecer quem são.
 */
export class Sensor extends Observable<EventoSensor> {
  id: string
  codigo: string
  vagaId: string
  ativo: boolean
  ocupado: boolean
  ultimaLeitura: Date | null

  constructor(id: string, codigo: string, vagaId: string, ativo = true) {
    super()
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

    // Só avisa os observadores quando o estado realmente muda.
    if (mudou) {
      this.notificar({ tipo: ocupado ? 'ocupada' : 'liberada', codigoSensor: this.codigo, vagaId: this.vagaId, momento })
    }
    return mudou
  }
}
