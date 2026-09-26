import { Notificacao } from '../../Notificacao'
import type { EventoSensor } from '../../Sensor'
import type { Observador } from '../Observador'

/** Observer concreto do Sensor: registra uma Notificacao para cada mudança de ocupação. */
export class ObservadorNotificacaoSensor implements Observador<EventoSensor> {
  notificacoes: Notificacao[]

  /** A lista fica em memória e pode ser compartilhada com outros observadores. */
  constructor(notificacoes: Notificacao[] = []) {
    this.notificacoes = notificacoes
  }

  atualizar(evento: EventoSensor): void {
    const id = `n-${this.notificacoes.length + 1}`
    const notificacao = evento.tipo === 'ocupada'
      ? new Notificacao(id, 'Vaga ocupada', `O sensor ${evento.codigoSensor} detectou um veículo na vaga ${evento.vagaId}.`, 'info', evento.momento)
      : new Notificacao(id, 'Vaga liberada', `A vaga ${evento.vagaId} está livre novamente.`, 'sucesso', evento.momento)
    this.notificacoes.push(notificacao)
  }
}
