import type { EstrategiaPagamento, FormaPagamento } from './EstrategiaPagamento'
import { PagamentoCredito } from './PagamentoCredito'
import { PagamentoDebito } from './PagamentoDebito'
import { PagamentoPix } from './PagamentoPix'

/*
 * Ponte entre a forma gravada/escolhida e o padrão Strategy.
 * Só escolhe a Strategy concreta; taxa, parcelamento e prefixo do comprovante
 * continuam dentro de cada Strategy. O PagamentoCredito valida o limite de parcelas.
 */
export const CRIAR_ESTRATEGIA_PAGAMENTO: Record<FormaPagamento, (parcelas: number) => EstrategiaPagamento> = {
  'Pix': () => new PagamentoPix(),
  'Crédito': (parcelas) => new PagamentoCredito(parcelas),
  'Débito': () => new PagamentoDebito(),
}
