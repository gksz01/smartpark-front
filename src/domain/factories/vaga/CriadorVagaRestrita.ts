import { VagaRestrita } from '../../vagas/VagaRestrita'
import { CriadorVaga } from './CriadorVaga'

/** Creator concreto: decide criar uma VagaRestrita. */
export class CriadorVagaRestrita extends CriadorVaga {
  criarVaga(id: string, codigo: string, setor: string): VagaRestrita {
    return new VagaRestrita(id, codigo, setor)
  }
}
