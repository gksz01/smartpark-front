// Mesmas formas oferecidas hoje na tela de pagamento.
export type FormaPagamento = 'Pix' | 'Crédito' | 'Débito'
export type StatusPagamento = 'pendente' | 'aprovado' | 'estornado'

/** Pagamento do período de estacionamento de um veículo. */
export class Pagamento {
  id: string
  valor: number
  forma: FormaPagamento
  veiculoId: string
  reservaId?: string
  status: StatusPagamento
  comprovante: string
  criadoEm: Date

  constructor(id: string, valor: number, forma: FormaPagamento, veiculoId: string, reservaId?: string, criadoEm: Date = new Date()) {
    this.id = id
    this.valor = valor
    this.forma = forma
    this.veiculoId = veiculoId
    this.reservaId = reservaId
    this.status = 'pendente'
    this.comprovante = ''
    this.criadoEm = criadoEm
  }

  /** Pagamento simulado: aprova e emite o comprovante. */
  processar(): void {
    if (this.status !== 'pendente') {
      throw new Error('Este pagamento já foi processado.')
    }
    if (this.valor <= 0) {
      throw new Error('O valor do pagamento deve ser maior que zero.')
    }
    this.status = 'aprovado'
    this.comprovante = this.gerarComprovante()
  }

  estornar(): void {
    if (this.status !== 'aprovado') {
      throw new Error('Apenas pagamentos aprovados podem ser estornados.')
    }
    this.status = 'estornado'
  }

  /** Código no mesmo formato já exibido pelo protótipo (SPK-XXXXXX). */
  gerarComprovante(): string {
    return `SPK-${this.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
  }

  estaAprovado(): boolean {
    return this.status === 'aprovado'
  }

  valorFormatado(): string {
    return `R$ ${this.valor.toFixed(2).replace('.', ',')}`
  }
}
