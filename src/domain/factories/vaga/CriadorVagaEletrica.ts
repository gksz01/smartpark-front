import { VagaEletrica } from '../../vagas/VagaEletrica'
import { CriadorVaga } from './CriadorVaga'

/** Creator concreto: decide criar uma VagaEletrica. */
export class CriadorVagaEletrica extends CriadorVaga {
  criarVaga(id: string, codigo: string, setor: string): VagaEletrica {
    return new VagaEletrica(id, codigo, setor)
  }
}
