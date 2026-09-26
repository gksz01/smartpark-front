import type { Estacionamento } from '../../Estacionamento'
import type { Vaga } from '../../Vaga'

/**
 * FACTORY METHOD — Exemplo 1: criação de vagas.
 *
 * Creator abstrato. Declara o Factory Method criarVaga(), mas NÃO decide
 * qual subclasse de Vaga será criada: cada Creator concreto decide.
 */
export abstract class CriadorVaga {
  /** Factory Method: implementado pelas subclasses. */
  abstract criarVaga(id: string, codigo: string, setor: string): Vaga

  /**
   * Operação comum a todos os Creators. Usa o Factory Method
   * sem saber qual tipo concreto de vaga está sendo criado.
   */
  cadastrarVaga(estacionamento: Estacionamento, id: string, codigo: string, setor: string): Vaga {
    const vaga = this.criarVaga(id, codigo, setor)
    estacionamento.adicionarVaga(vaga)
    return vaga
  }
}
