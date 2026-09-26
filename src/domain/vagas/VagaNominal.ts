import { Vaga, type StatusVaga } from '../Vaga'

/** Produto concreto: vaga do Condomínio vinculada a uma unidade (apartamento). */
export class VagaNominal extends Vaga {
  constructor(id: string, codigo: string, setor: string, status: StatusVaga = 'Livre') {
    super(id, codigo, setor, 'Nominal', status)
  }

  requisitoDeUso(): string {
    return 'Exclusiva do morador da unidade vinculada'
  }
}
