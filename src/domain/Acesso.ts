import type { AccessDirection, AccessMethod, AccessStatus } from '../core/types'

// Mesmos valores da tela de Entradas e saídas (core/types.ts).
export type DirecaoAcesso = AccessDirection
export type StatusAcesso = AccessStatus

/**
 * Registro de uma entrada ou saída na portaria.
 * O identificador depende do método do cliente: placa (LPR), código (QR) ou tag (RFID).
 */
export class Acesso {
  id: string
  pessoa: string
  identificador: string
  metodo: AccessMethod
  direcao: DirecaoAcesso
  status: StatusAcesso
  manual: boolean
  horario: Date
  motivoNegacao?: string

  constructor(id: string, pessoa: string, identificador: string, metodo: AccessMethod, direcao: DirecaoAcesso, manual = false, horario: Date = new Date()) {
    this.id = id
    this.pessoa = pessoa
    this.identificador = identificador
    this.metodo = metodo
    this.direcao = direcao
    this.status = 'Pendente'
    this.manual = manual
    this.horario = horario
  }

  liberar(): void {
    if (this.status !== 'Pendente') {
      throw new Error(`Este acesso já foi ${this.status.toLowerCase()}.`)
    }
    this.status = 'Liberado'
  }

  negar(motivo: string): void {
    if (this.status !== 'Pendente') {
      throw new Error(`Este acesso já foi ${this.status.toLowerCase()}.`)
    }
    if (!motivo.trim()) {
      throw new Error('Informe o motivo da negação.')
    }
    this.status = 'Negado'
    this.motivoNegacao = motivo.trim()
  }

  /** Liberação feita por um operador, fora da leitura automática. */
  ehManual(): boolean {
    return this.manual || this.metodo === 'MANUAL'
  }

  ehEntrada(): boolean {
    return this.direcao === 'Entrada'
  }

  /** Formato HH:MM usado na tabela de acessos. */
  horarioFormatado(): string {
    const horas = String(this.horario.getHours()).padStart(2, '0')
    const minutos = String(this.horario.getMinutes()).padStart(2, '0')
    return `${horas}:${minutos}`
  }
}
