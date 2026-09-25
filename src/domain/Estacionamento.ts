import type { TipoVaga, Vaga } from './Vaga'

/** Um estacionamento do cliente, composto por um conjunto de vagas. */
export class Estacionamento {
  id: string
  nome: string
  endereco: string
  aberto24h: boolean
  restrito: boolean
  vagas: Vaga[]

  constructor(id: string, nome: string, endereco: string, aberto24h = true, restrito = false, vagas: Vaga[] = []) {
    this.id = id
    this.nome = nome
    this.endereco = endereco
    this.aberto24h = aberto24h
    this.restrito = restrito
    this.vagas = vagas
  }

  adicionarVaga(vaga: Vaga): void {
    if (this.vagas.some((item) => item.codigo === vaga.codigo)) {
      throw new Error(`Já existe uma vaga com o código ${vaga.codigo}.`)
    }
    this.vagas.push(vaga)
  }

  totalVagas(): number {
    return this.vagas.length
  }

  vagasLivres(): number {
    return this.vagas.filter((vaga) => vaga.estaDisponivel()).length
  }

  /** Percentual (0 a 100) de vagas que não estão livres. */
  taxaOcupacao(): number {
    if (this.totalVagas() === 0) return 0
    const indisponiveis = this.totalVagas() - this.vagasLivres()
    return Math.round((indisponiveis / this.totalVagas()) * 100)
  }

  estaLotado(): boolean {
    return this.vagasLivres() === 0
  }

  /** Primeira vaga livre, opcionalmente de um tipo específico. */
  buscarVagaLivre(tipo?: TipoVaga): Vaga | undefined {
    return this.vagas.find((vaga) => vaga.estaDisponivel() && (!tipo || vaga.tipo === tipo))
  }
}
