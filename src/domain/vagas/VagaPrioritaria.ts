import { Vaga, type StatusVaga } from '../Vaga'

/** Produto concreto: vaga do Hospital próxima à entrada, para pacientes e acompanhantes. */
export class VagaPrioritaria extends Vaga {
  static LIMITE_HORAS = 6

  constructor(id: string, codigo: string, setor: string, status: StatusVaga = 'Livre') {
    super(id, codigo, setor, 'Prioritária', status)
  }

  requisitoDeUso(): string {
    return 'Exclusiva para pacientes e acompanhantes'
  }

  permanenciaMaximaHoras(): number {
    return VagaPrioritaria.LIMITE_HORAS
  }
}
