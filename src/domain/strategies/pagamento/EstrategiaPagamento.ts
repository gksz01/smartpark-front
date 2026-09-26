// Mesmas formas oferecidas hoje na tela de pagamento.
export type FormaPagamento = 'Pix' | 'Crédito' | 'Débito'

/** O que cada estratégia devolve depois de processar o valor. */
export interface ResultadoPagamento {
  valorCobrado: number
  detalhe: string
}

/**
 * STRATEGY — Exemplo 2: processamento de pagamento.
 *
 * Contrato comum a todas as formas de pagamento.
 * A classe Pagamento (Context) conhece apenas esta interface,
 * e não sabe qual forma concreta está sendo usada.
 */
export interface EstrategiaPagamento {
  forma: FormaPagamento
  prefixoComprovante: string
  processar(valor: number): ResultadoPagamento
}
