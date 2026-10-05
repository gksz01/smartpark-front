import type { EstrategiaPagamento, FormaPagamento, ResultadoPagamento } from './EstrategiaPagamento'

const MAXIMO_PARCELAS = 3
const TAXA_PARCELAMENTO = 0.05 // 5% quando parcelado

/** Estratégia concreta: crédito à vista sem taxa ou parcelado em até 3x com 5% de taxa. */
export class PagamentoCredito implements EstrategiaPagamento {
  /** Exposto para a tela montar as opções sem repetir a regra. */
  static MAXIMO_PARCELAS = MAXIMO_PARCELAS

  forma: FormaPagamento = 'Crédito'
  prefixoComprovante = 'CRE'
  parcelas: number

  constructor(parcelas = 1) {
    if (parcelas < 1 || parcelas > MAXIMO_PARCELAS) {
      throw new Error(`O crédito aceita de 1 a ${MAXIMO_PARCELAS} parcelas.`)
    }
    this.parcelas = parcelas
  }

  processar(valor: number): ResultadoPagamento {
    if (this.parcelas === 1) {
      return { valorCobrado: valor, detalhe: 'Crédito à vista' }
    }
    const valorCobrado = Math.round(valor * (1 + TAXA_PARCELAMENTO) * 100) / 100
    const valorParcela = (valorCobrado / this.parcelas).toFixed(2).replace('.', ',')
    return { valorCobrado, detalhe: `Crédito em ${this.parcelas}x de R$ ${valorParcela}` }
  }
}
