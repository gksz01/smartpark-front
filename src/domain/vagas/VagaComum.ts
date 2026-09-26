import { Vaga, type StatusVaga } from '../Vaga'

/** Produto concreto: vaga sem restrição, para qualquer veículo. */
export class VagaComum extends Vaga {
  constructor(id: string, codigo: string, setor: string, status: StatusVaga = 'Livre') {
    super(id, codigo, setor, 'Comum', status)
  }

  requisitoDeUso(): string {
    return 'Livre para qualquer veículo'
  }
}
