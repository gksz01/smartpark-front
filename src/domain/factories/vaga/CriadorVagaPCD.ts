import { VagaPCD } from '../../vagas/VagaPCD'
import { CriadorVaga } from './CriadorVaga'

/** Creator concreto: decide criar uma VagaPCD. */
export class CriadorVagaPCD extends CriadorVaga {
  criarVaga(id: string, codigo: string, setor: string): VagaPCD {
    return new VagaPCD(id, codigo, setor)
  }
}
