import type { EstrategiaPagamento, FormaPagamento, ResultadoPagamento } from './EstrategiaPagamento'

/** Estratégia concreta: débito é aprovado na hora, sem taxa, sempre à vista. */
export class PagamentoDebito implements EstrategiaPagamento {
  forma: FormaPagamento = 'Débito'
  prefixoComprovante = 'DEB'

  processar(valor: number): ResultadoPagamento {
    return { valorCobrado: valor, detalhe: 'Débito aprovado à vista' }
  }
}
