import type { PaymentStatus } from '../core/types'
import type { EstrategiaPagamento, FormaPagamento } from './strategies/pagamento/EstrategiaPagamento'

// Mesmos status usados pela tela e pela tabela pagamentos (core/types.ts).
export type StatusPagamento = PaymentStatus

/**
 * STRATEGY — Context do exemplo de pagamento.
 *
 * O Pagamento cuida das regras comuns (status, valor, comprovante)
 * e delega o processamento para a EstrategiaPagamento escolhida
 * (Pix, Crédito ou Débito), sem saber qual é.
 */
export class Pagamento {
  id: string
  valor: number
  estrategia: EstrategiaPagamento
  veiculoId: string
  reservaId?: string
  status: StatusPagamento
  valorCobrado: number
  detalhe: string
  comprovante: string
  criadoEm: Date

  constructor(id: string, valor: number, estrategia: EstrategiaPagamento, veiculoId: string, reservaId?: string, criadoEm: Date = new Date()) {
    this.id = id
    this.valor = valor
    this.estrategia = estrategia
    this.veiculoId = veiculoId
    this.reservaId = reservaId
    this.status = 'pendente'
    this.valorCobrado = 0
    this.detalhe = ''
    this.comprovante = ''
    this.criadoEm = criadoEm
  }

  /** Forma de pagamento da estratégia atual. */
  get forma(): FormaPagamento {
    return this.estrategia.forma
  }

  /** A forma de pagamento só pode ser trocada antes do processamento. */
  definirEstrategia(estrategia: EstrategiaPagamento): void {
    if (this.status !== 'pendente') {
      throw new Error('Não é possível trocar a forma de um pagamento já processado.')
    }
    this.estrategia = estrategia
  }

  /** Pagamento simulado: a estratégia processa e o Pagamento aprova e emite o comprovante. */
  processar(): void {
    if (this.status !== 'pendente') {
      throw new Error('Este pagamento já foi processado.')
    }
    // Valor zero é aceito: um convênio de isenção (TarifaComConvenio) gera pagamento isento de R$ 0,00
    if (this.valor < 0) {
      throw new Error('O valor do pagamento não pode ser negativo.')
    }
    const resultado = this.estrategia.processar(this.valor)
    this.valorCobrado = resultado.valorCobrado
    this.detalhe = resultado.detalhe
    this.status = 'aprovado'
    this.comprovante = this.gerarComprovante()
  }

  estornar(): void {
    if (this.status !== 'aprovado') {
      throw new Error('Apenas pagamentos aprovados podem ser estornados.')
    }
    this.status = 'estornado'
  }

  /** O prefixo identifica a forma de pagamento: PIX-, CRE- ou DEB-. */
  gerarComprovante(): string {
    return `${this.estrategia.prefixoComprovante}-${this.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
  }

  estaAprovado(): boolean {
    return this.status === 'aprovado'
  }

  valorFormatado(): string {
    return `R$ ${this.valor.toFixed(2).replace('.', ',')}`
  }
}
