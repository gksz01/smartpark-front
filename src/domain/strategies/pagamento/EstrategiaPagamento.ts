import type { PaymentMethod } from '../../../core/types'

// Mesmas formas usadas pela tela e pela tabela pagamentos (core/types.ts).
export type FormaPagamento = PaymentMethod

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
