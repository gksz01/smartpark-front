import { Vaga, type StatusVaga } from '../Vaga'

/** Produto concreto: vaga com carregador, com tempo limitado para liberar a recarga a outros veículos. */
export class VagaEletrica extends Vaga {
  static LIMITE_RECARGA_HORAS = 4

  constructor(id: string, codigo: string, setor: string, status: StatusVaga = 'Livre') {
    super(id, codigo, setor, 'Elétrico', status)
  }

  requisitoDeUso(): string {
    return 'Exclusiva para veículos elétricos em recarga'
  }

  permanenciaMaximaHoras(): number {
    return VagaEletrica.LIMITE_RECARGA_HORAS
  }
}
