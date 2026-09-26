import { VagaComum } from '../../vagas/VagaComum'
import { CriadorVaga } from './CriadorVaga'

/** Creator concreto: decide criar uma VagaComum. */
export class CriadorVagaComum extends CriadorVaga {
  criarVaga(id: string, codigo: string, setor: string): VagaComum {
    return new VagaComum(id, codigo, setor)
  }
}
