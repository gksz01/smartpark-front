export { Acesso, type DirecaoAcesso, type StatusAcesso } from './Acesso'
export { Atendimento } from './Atendimento'
export { Convenio, type TipoBeneficio } from './Convenio'
export { Estacionamento } from './Estacionamento'
export { Notificacao, type TipoNotificacao } from './Notificacao'
export { Pagamento, type StatusPagamento } from './Pagamento'
export { Reserva, type StatusReserva } from './Reserva'
export { Sensor } from './Sensor'
export { Tarifa } from './Tarifa'
export { Usuario, type TipoUsuario } from './Usuario'
export { Vaga, type StatusVaga, type TipoVaga } from './Vaga'
export { Veiculo } from './Veiculo'

// Strategy — Exemplo 1: tarifa
export type { EstrategiaTarifa } from './strategies/tarifa/EstrategiaTarifa'
export { TarifaComConvenio } from './strategies/tarifa/TarifaComConvenio'
export { TarifaFixaDiaria } from './strategies/tarifa/TarifaFixaDiaria'
export { TarifaPorHora } from './strategies/tarifa/TarifaPorHora'

// Strategy — Exemplo 2: pagamento
export type { EstrategiaPagamento, FormaPagamento, ResultadoPagamento } from './strategies/pagamento/EstrategiaPagamento'
export { PagamentoCredito } from './strategies/pagamento/PagamentoCredito'
export { PagamentoDebito } from './strategies/pagamento/PagamentoDebito'
export { PagamentoPix } from './strategies/pagamento/PagamentoPix'
