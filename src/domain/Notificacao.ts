export type TipoNotificacao = 'info' | 'sucesso' | 'alerta'

/** Mensagem exibida ao usuário sobre algo que aconteceu no estacionamento. */
export class Notificacao {
  id: string
  titulo: string
  mensagem: string
  tipo: TipoNotificacao
  criadaEm: Date
  lida: boolean

  constructor(id: string, titulo: string, mensagem: string, tipo: TipoNotificacao = 'info', criadaEm: Date = new Date()) {
    this.id = id
    this.titulo = titulo
    this.mensagem = mensagem
    this.tipo = tipo
    this.criadaEm = criadaEm
    this.lida = false
  }

  /** Ex.: "[14:32] Vaga ocupada: A-01 foi ocupada." */
  formatar(): string {
    const horas = String(this.criadaEm.getHours()).padStart(2, '0')
    const minutos = String(this.criadaEm.getMinutes()).padStart(2, '0')
    return `[${horas}:${minutos}] ${this.titulo}: ${this.mensagem}`
  }

  marcarComoLida(): void {
    this.lida = true
  }

  ehAlerta(): boolean {
    return this.tipo === 'alerta'
  }
}
