import type { Tarifa } from './Tarifa'

export type StatusReserva = 'pendente' | 'confirmada' | 'cancelada' | 'concluida'

/** Reserva antecipada de uma vaga para um veículo. */
export class Reserva {
  /** Mesma tolerância informada ao usuário na tela de reserva. */
  static TOLERANCIA_MINUTOS = 15

  id: string
  veiculoId: string
  vagaId: string
  data: string // AAAA-MM-DD
  hora: string // HH:MM
  duracaoHoras: number
  status: StatusReserva
  valorEstimado: number

  constructor(id: string, veiculoId: string, vagaId: string, data: string, hora: string, duracaoHoras: number, status: StatusReserva = 'pendente', valorEstimado = 0) {
    this.id = id
    this.veiculoId = veiculoId
    this.vagaId = vagaId
    this.data = data
    this.hora = hora
    this.duracaoHoras = duracaoHoras
    this.status = status
    this.valorEstimado = valorEstimado
  }

  calcularEstimativa(tarifa: Tarifa): number {
    this.valorEstimado = tarifa.calcular(this.duracaoHoras)
    return this.valorEstimado
  }

  confirmar(): void {
    if (this.status !== 'pendente') {
      throw new Error('Apenas reservas pendentes podem ser confirmadas.')
    }
    this.status = 'confirmada'
  }

  cancelar(): void {
    if (this.status === 'cancelada' || this.status === 'concluida') {
      throw new Error(`Uma reserva ${this.status} não pode ser cancelada.`)
    }
    this.status = 'cancelada'
  }

  alterar(data: string, hora: string, duracaoHoras: number): void {
    if (!this.estaAtiva()) {
      throw new Error('Apenas reservas pendentes ou confirmadas podem ser alteradas.')
    }
    if (duracaoHoras <= 0) {
      throw new Error('A duração da reserva deve ser maior que zero.')
    }
    this.data = data
    this.hora = hora
    this.duracaoHoras = duracaoHoras
  }

  concluir(): void {
    if (this.status !== 'confirmada') {
      throw new Error('Apenas reservas confirmadas podem ser concluídas.')
    }
    this.status = 'concluida'
  }

  estaAtiva(): boolean {
    return this.status === 'pendente' || this.status === 'confirmada'
  }

  inicio(): Date {
    return new Date(`${this.data}T${this.hora}`)
  }

  /** Reserva confirmada cujo horário + tolerância já passou sem a entrada do veículo. */
  expirou(agora: Date = new Date()): boolean {
    if (this.status !== 'confirmada') return false
    const limite = this.inicio().getTime() + Reserva.TOLERANCIA_MINUTOS * 60 * 1000
    return agora.getTime() > limite
  }
}
