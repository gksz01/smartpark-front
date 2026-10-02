import { Vaga, type StatusVaga } from '../Vaga'

/** Produto concreto: vaga de acesso restrito (ex.: diretoria), liberada só a credenciais autorizadas. */
export class VagaRestrita extends Vaga {
  constructor(id: string, codigo: string, setor: string, status: StatusVaga = 'Livre') {
    super(id, codigo, setor, 'Restrito', status)
  }

  requisitoDeUso(): string {
    return 'Exclusiva para credenciais autorizadas'
  }
}
