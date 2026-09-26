import { Vaga, type StatusVaga } from '../Vaga'

/** Produto concreto: vaga reservada a pessoas com deficiência. */
export class VagaPCD extends Vaga {
  constructor(id: string, codigo: string, setor: string, status: StatusVaga = 'Livre') {
    super(id, codigo, setor, 'PCD', status)
  }

  requisitoDeUso(): string {
    return 'Exige credencial PCD visível no veículo'
  }
}
