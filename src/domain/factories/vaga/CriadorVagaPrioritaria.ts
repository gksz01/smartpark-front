import { VagaPrioritaria } from '../../vagas/VagaPrioritaria'
import { CriadorVaga } from './CriadorVaga'

/** Creator concreto: decide criar uma VagaPrioritaria. */
export class CriadorVagaPrioritaria extends CriadorVaga {
  criarVaga(id: string, codigo: string, setor: string): VagaPrioritaria {
    return new VagaPrioritaria(id, codigo, setor)
  }
}
