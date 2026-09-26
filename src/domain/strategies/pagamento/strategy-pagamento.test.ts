import { describe, expect, it } from 'vitest'
import { Pagamento, PagamentoCredito, PagamentoDebito, PagamentoPix, type EstrategiaPagamento } from '../..'

describe('Strategy — Exemplo 2: processamento de pagamento', () => {
  it('Pix, Crédito e Débito são processados pelo mesmo contrato', () => {
    const estrategias: EstrategiaPagamento[] = [new PagamentoPix(), new PagamentoCredito(), new PagamentoDebito()]

    const pagamentos = estrategias.map((estrategia) => {
      const pagamento = new Pagamento('a1b2c3d4', 28, estrategia, 'v-1')
      pagamento.processar() // mesma chamada para todas as formas
      return pagamento
    })

    expect(pagamentos.map((pagamento) => pagamento.forma)).toEqual(['Pix', 'Crédito', 'Débito'])
    expect(pagamentos.map((pagamento) => pagamento.comprovante)).toEqual(['PIX-A1B2C3', 'CRE-A1B2C3', 'DEB-A1B2C3'])
    expect(pagamentos.every((pagamento) => pagamento.estaAprovado())).toBe(true)
  })

  it('cada estratégia tem seu próprio comportamento', () => {
    const pix = new Pagamento('p-1', 28, new PagamentoPix(), 'v-1')
    const debito = new Pagamento('p-2', 28, new PagamentoDebito(), 'v-1')
    const creditoParcelado = new Pagamento('p-3', 28, new PagamentoCredito(3), 'v-1')

    pix.processar()
    debito.processar()
    creditoParcelado.processar()

    expect(pix.valorCobrado).toBe(28)
    expect(pix.detalhe).toBe('Pix aprovado instantaneamente')
    expect(debito.valorCobrado).toBe(28)
    expect(debito.detalhe).toBe('Débito aprovado à vista')
    expect(creditoParcelado.valorCobrado).toBe(29.4) // 28 + 5% de taxa
    expect(creditoParcelado.detalhe).toBe('Crédito em 3x de R$ 9,80')
  })

  it('trocar a estratégia antes de processar muda o resultado', () => {
    const pagamento = new Pagamento('a1b2c3d4', 28, new PagamentoPix(), 'v-1')
    expect(pagamento.forma).toBe('Pix')

    pagamento.definirEstrategia(new PagamentoCredito(2))
    pagamento.processar()

    expect(pagamento.forma).toBe('Crédito')
    expect(pagamento.valorCobrado).toBe(29.4)
    expect(pagamento.comprovante).toBe('CRE-A1B2C3')
  })

  it('não permite trocar a estratégia depois do processamento', () => {
    const pagamento = new Pagamento('p-1', 28, new PagamentoPix(), 'v-1')
    pagamento.processar()
    expect(() => pagamento.definirEstrategia(new PagamentoDebito())).toThrow('já processado')
  })

  it('crédito à vista não tem taxa e o parcelamento é limitado a 3x', () => {
    expect(new PagamentoCredito(1).processar(28)).toEqual({ valorCobrado: 28, detalhe: 'Crédito à vista' })
    expect(() => new PagamentoCredito(4)).toThrow('de 1 a 3 parcelas')
    expect(() => new PagamentoCredito(0)).toThrow('de 1 a 3 parcelas')
  })
})
