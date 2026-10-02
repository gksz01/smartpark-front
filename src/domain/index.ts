export { Acesso, type DirecaoAcesso, type StatusAcesso } from './Acesso'
export { Atendimento } from './Atendimento'
export { Convenio, type TipoBeneficio } from './Convenio'
export { Estacionamento } from './Estacionamento'
export { Notificacao, type TipoNotificacao } from './Notificacao'
export { Pagamento, type StatusPagamento } from './Pagamento'
export { Reserva, type StatusReserva } from './Reserva'
export { Sensor, type EventoSensor } from './Sensor'
export { Tarifa } from './Tarifa'
export { Usuario, type TipoUsuario } from './Usuario'
export { Vaga, type StatusVaga, type TipoVaga } from './Vaga'
export { Veiculo } from './Veiculo'

// Strategy — Exemplo 1: tarifa
export type { EstrategiaTarifa } from './strategies/tarifa/EstrategiaTarifa'
export { TarifaComConvenio } from './strategies/tarifa/TarifaComConvenio'
export { TarifaFixaDiaria } from './strategies/tarifa/TarifaFixaDiaria'
export { TarifaIsenta } from './strategies/tarifa/TarifaIsenta'
export { TarifaPorHora } from './strategies/tarifa/TarifaPorHora'

// Strategy — Exemplo 2: pagamento
export type { EstrategiaPagamento, FormaPagamento, ResultadoPagamento } from './strategies/pagamento/EstrategiaPagamento'
export { PagamentoCredito } from './strategies/pagamento/PagamentoCredito'
export { PagamentoDebito } from './strategies/pagamento/PagamentoDebito'
export { PagamentoPix } from './strategies/pagamento/PagamentoPix'

// Factory Method — Exemplo 1: vagas (produtos e creators)
export { VagaComum } from './vagas/VagaComum'
export { VagaEletrica } from './vagas/VagaEletrica'
export { VagaNominal } from './vagas/VagaNominal'
export { VagaPCD } from './vagas/VagaPCD'
export { VagaPrioritaria } from './vagas/VagaPrioritaria'
export { VagaRestrita } from './vagas/VagaRestrita'
export { CriadorVaga } from './factories/vaga/CriadorVaga'
export { CriadorVagaComum } from './factories/vaga/CriadorVagaComum'
export { CriadorVagaEletrica } from './factories/vaga/CriadorVagaEletrica'
export { CriadorVagaNominal } from './factories/vaga/CriadorVagaNominal'
export { CriadorVagaPCD } from './factories/vaga/CriadorVagaPCD'
export { CriadorVagaPrioritaria } from './factories/vaga/CriadorVagaPrioritaria'
export { CriadorVagaRestrita } from './factories/vaga/CriadorVagaRestrita'
export { CRIADOR_POR_TIPO } from './factories/vaga/criadorPorTipo'

// Factory Method — Exemplo 2: variantes da LPS
export { VarianteSmartPark } from './factories/variante/VarianteSmartPark'
export { VarianteCondominio } from './factories/variante/VarianteCondominio'
export { VarianteEmpresa } from './factories/variante/VarianteEmpresa'
export { VarianteHospital } from './factories/variante/VarianteHospital'
export { VarianteShopping } from './factories/variante/VarianteShopping'

// Observer — infraestrutura comum
export type { Observador } from './observer/Observador'
export { Observable } from './observer/Observable'

// Observer — Exemplo 1: sensor (o Subject é a classe Sensor)
export { ObservadorNotificacaoSensor } from './observer/sensor/ObservadorNotificacaoSensor'
export { ObservadorVagaSensor } from './observer/sensor/ObservadorVagaSensor'

// Observer — Exemplo 2: reservas
export { EventosReserva, type EventoReserva } from './observer/reserva/EventosReserva'
export { ObservadorNotificacaoReserva } from './observer/reserva/ObservadorNotificacaoReserva'
export { ObservadorVagaReserva } from './observer/reserva/ObservadorVagaReserva'

// Observer — montagem por variante (feature flag notifications)
export { criarEventosReserva, registrarObservadoresSensor } from './observer/registrarObservadores'
