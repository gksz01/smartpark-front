import type { TipoVaga } from '../../Vaga'
import type { CriadorVaga } from './CriadorVaga'
import { CriadorVagaComum } from './CriadorVagaComum'
import { CriadorVagaEletrica } from './CriadorVagaEletrica'
import { CriadorVagaNominal } from './CriadorVagaNominal'
import { CriadorVagaPCD } from './CriadorVagaPCD'
import { CriadorVagaPrioritaria } from './CriadorVagaPrioritaria'
import { CriadorVagaRestrita } from './CriadorVagaRestrita'

/**
 * Qual Creator atende cada tipo de vaga escolhido na tela.
 *
 * Esta tabela só ESCOLHE o Creator; quem cria a vaga continua sendo o
 * Factory Method criarVaga() de cada Creator concreto. O Record obriga a
 * existir um Creator para todo TipoVaga: um tipo novo sem Creator não compila.
 */
export const CRIADOR_POR_TIPO: Record<TipoVaga, CriadorVaga> = {
  'Comum': new CriadorVagaComum(),
  'PCD': new CriadorVagaPCD(),
  'Elétrico': new CriadorVagaEletrica(),
  'Nominal': new CriadorVagaNominal(),
  'Restrito': new CriadorVagaRestrita(),
  'Prioritária': new CriadorVagaPrioritaria(),
}
