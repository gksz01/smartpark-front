import { VagaNominal } from '../../vagas/VagaNominal'
import { CriadorVaga } from './CriadorVaga'

/** Creator concreto: decide criar uma VagaNominal. */
export class CriadorVagaNominal extends CriadorVaga {
  criarVaga(id: string, codigo: string, setor: string): VagaNominal {
    return new VagaNominal(id, codigo, setor)
  }
}
