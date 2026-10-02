import type { ParkingSpace } from '../core/types'

// Mesmos tipos e status da tela de Vagas (core/types.ts).
export type TipoVaga = ParkingSpace['type']
export type StatusVaga = ParkingSpace['status']

/**
 * Uma vaga física do estacionamento e o seu estado atual.
 * É o Product do Factory Method de vagas: as subclasses em domain/vagas/
 * sobrescrevem requisitoDeUso() e permanenciaMaximaHoras().
 */
export class Vaga {
  id: string
  codigo: string
  setor: string
  tipo: TipoVaga
  status: StatusVaga

  constructor(id: string, codigo: string, setor: string, tipo: TipoVaga, status: StatusVaga = 'Livre') {
    this.id = id
    this.codigo = codigo
    this.setor = setor
    this.tipo = tipo
    this.status = status
  }

  estaDisponivel(): boolean {
    return this.status === 'Livre'
  }

  /** Um veículo entrou na vaga. Vagas reservadas também podem ser ocupadas. */
  ocupar(): void {
    if (this.status !== 'Livre' && this.status !== 'Reservada') {
      throw new Error(`A vaga ${this.codigo} não pode ser ocupada (status: ${this.status}).`)
    }
    this.status = 'Ocupada'
  }

  /** O veículo saiu ou a reserva foi cancelada. */
  liberar(): void {
    if (this.status === 'Bloqueada') {
      throw new Error(`A vaga ${this.codigo} está bloqueada. Desbloqueie antes de liberar.`)
    }
    this.status = 'Livre'
  }

  reservar(): void {
    if (!this.estaDisponivel()) {
      throw new Error(`A vaga ${this.codigo} não está livre para reserva.`)
    }
    this.status = 'Reservada'
  }

  /** Manutenção ou interdição. Não é possível bloquear uma vaga ocupada. */
  bloquear(): void {
    if (this.status === 'Ocupada') {
      throw new Error(`A vaga ${this.codigo} está ocupada e não pode ser bloqueada.`)
    }
    this.status = 'Bloqueada'
  }

  desbloquear(): void {
    if (this.status === 'Bloqueada') this.status = 'Livre'
  }

  /** Só é seguro excluir uma vaga sem veículo e sem reserva. */
  podeSerExcluida(): boolean {
    return this.status === 'Livre' || this.status === 'Bloqueada'
  }

  /** PCD, elétrica, nominal, restrita ou prioritária. */
  ehEspecial(): boolean {
    return this.tipo !== 'Comum'
  }

  /** Quem pode usar a vaga. As subclasses sobrescrevem. */
  requisitoDeUso(): string {
    return 'Sem restrição de uso'
  }

  /** Tempo máximo de permanência em horas; null significa sem limite. */
  permanenciaMaximaHoras(): number | null {
    return null
  }

  excedeuPermanencia(horas: number): boolean {
    const maximo = this.permanenciaMaximaHoras()
    return maximo !== null && horas > maximo
  }
}
