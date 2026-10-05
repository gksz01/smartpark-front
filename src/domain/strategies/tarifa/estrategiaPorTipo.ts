import type { TariffStrategyType } from '../../../core/types'
import type { EstrategiaTarifa } from './EstrategiaTarifa'
import { TarifaFixaDiaria } from './TarifaFixaDiaria'
import { TarifaIsenta } from './TarifaIsenta'
import { TarifaPorHora } from './TarifaPorHora'

/*
 * Ponte entre o BANCO e o padrão Strategy.
 *
 * O banco guarda apenas o tipo (POR_HORA, DIARIA, ISENTA) e os números.
 * Estas funções só reconstroem a Strategy gravada (e fazem o caminho inverso).
 * Elas NÃO calculam nada: o cálculo continua dentro de cada Strategy,
 * e a classe Tarifa continua delegando para ela sem nenhum if.
 */

export type TipoEstrategiaTarifa = TariffStrategyType

/** Configuração de uma Strategy como fica gravada na tabela tarifas. */
export interface ConfiguracaoTarifa {
  tipo: TipoEstrategiaTarifa
  valor: number
  valorMaximoDiario: number | null
}

/** tipo_estrategia → Strategy concreta. */
export const CRIAR_ESTRATEGIA: Record<TipoEstrategiaTarifa, (config: ConfiguracaoTarifa) => EstrategiaTarifa> = {
  POR_HORA: (config) => new TarifaPorHora(config.valor, config.valorMaximoDiario ?? undefined),
  DIARIA: (config) => new TarifaFixaDiaria(config.valor),
  ISENTA: () => new TarifaIsenta(),
}

/** Strategy → configuração para gravar (usado, por exemplo, com a Strategy criada pela variante). */
export function configuracaoDaEstrategia(estrategia: EstrategiaTarifa): ConfiguracaoTarifa {
  if (estrategia instanceof TarifaPorHora) return { tipo: 'POR_HORA', valor: estrategia.valorHora, valorMaximoDiario: estrategia.valorMaximoDiario ?? null }
  if (estrategia instanceof TarifaFixaDiaria) return { tipo: 'DIARIA', valor: estrategia.valorDiaria, valorMaximoDiario: null }
  if (estrategia instanceof TarifaIsenta) return { tipo: 'ISENTA', valor: 0, valorMaximoDiario: null }
  // TarifaComConvenio é composta na hora (Hospital + convênio) e não é gravada como tarifa independente
  throw new Error('Esta estratégia não pode ser gravada como tarifa independente.')
}
