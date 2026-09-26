import type { EstrategiaPagamento, FormaPagamento, ResultadoPagamento } from './EstrategiaPagamento'

/** Estratégia concreta: Pix é aprovado na hora, sem taxa. */
export class PagamentoPix implements EstrategiaPagamento {
  forma: FormaPagamento = 'Pix'
  prefixoComprovante = 'PIX'

  processar(valor: number): ResultadoPagamento {
    return { valorCobrado: valor, detalhe: 'Pix aprovado instantaneamente' }
  }
}
