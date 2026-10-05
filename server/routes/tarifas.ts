import { Router, type Request, type Response } from 'express'
import { FEATURE_LABELS, isTenantId, TARIFF_STRATEGIES, TARIFF_STRATEGY_LABELS, TENANTS } from '../../src/core/config'
import type { TariffStrategyType, TenantId } from '../../src/core/types'
import { configuracaoDaEstrategia, CRIAR_ESTRATEGIA } from '../../src/domain/strategies/tarifa/estrategiaPorTipo'
import { Tarifa } from '../../src/domain/Tarifa'
import type { Banco } from '../database/conexao'

/** Formato de uma linha da tabela tarifas. */
interface LinhaTarifa {
  id: number
  tenant_id: string
  nome: string
  tipo_estrategia: TariffStrategyType
  valor: number
  valor_maximo_diario: number | null
  ativa: number // 0 ou 1
}

/** Linha do banco → Tarifa (Context) com a Strategy reconstruída a partir de tipo_estrategia. */
function paraTarifa(linha: LinhaTarifa): Tarifa {
  const estrategia = CRIAR_ESTRATEGIA[linha.tipo_estrategia]({ tipo: linha.tipo_estrategia, valor: linha.valor, valorMaximoDiario: linha.valor_maximo_diario })
  return new Tarifa(String(linha.id), linha.nome, estrategia)
}

/** Tarifa → formato Tariff do frontend (core/types.ts). Os números saem da própria Strategy. */
function paraJson(tarifa: Tarifa, ativa: boolean) {
  const configuracao = configuracaoDaEstrategia(tarifa.estrategia)
  return {
    id: tarifa.id,
    name: tarifa.nome,
    strategy: configuracao.tipo,
    value: configuracao.valor,
    maxDaily: configuracao.valorMaximoDiario,
    active: ativa,
  }
}

/**
 * Todo pedido precisa informar um tenant válido E com a feature billing ligada.
 * A mesma flag de config.ts que esconde o menu bloqueia a API.
 */
function lerTenantComCobranca(req: Request, res: Response): TenantId | null {
  const tenant = req.query.tenant
  if (typeof tenant !== 'string' || !isTenantId(tenant)) {
    res.status(400).json({ erro: 'Informe um tenant válido em ?tenant=' })
    return null
  }
  if (!TENANTS[tenant].features.billing) {
    res.status(403).json({ erro: `O módulo ${FEATURE_LABELS.billing} não está disponível para ${TENANTS[tenant].name}.` })
    return null
  }
  return tenant
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

/** Valida o corpo do pedido e devolve a Tarifa já montada com a Strategy escolhida. */
function validar(corpo: Record<string, unknown>): { tarifa?: Tarifa; ativa?: boolean; erro?: string } {
  const nome = texto(corpo.name)
  const tipo = texto(corpo.strategy) as TariffStrategyType
  if (!nome) return { erro: 'Informe o campo Nome.' }
  if (!TARIFF_STRATEGIES.includes(tipo)) {
    return { erro: `Tipo de cálculo inválido. Use: ${TARIFF_STRATEGIES.map((item) => TARIFF_STRATEGY_LABELS[item]).join(', ')}.` }
  }
  if (typeof corpo.active !== 'boolean') return { erro: 'Informe se a tarifa está ativa.' }

  // A tarifa isenta não cobra valor; as demais precisam de valor positivo
  const valor = tipo === 'ISENTA' ? 0 : typeof corpo.value === 'number' ? corpo.value : NaN
  if (tipo !== 'ISENTA' && !(valor > 0)) return { erro: 'Informe um valor maior que zero.' }

  const teto = corpo.maxDaily === null || corpo.maxDaily === undefined ? null : typeof corpo.maxDaily === 'number' ? corpo.maxDaily : NaN
  if (teto !== null && tipo !== 'POR_HORA') return { erro: 'O teto diário só se aplica à tarifa por hora.' }
  if (teto !== null && !(teto >= valor)) return { erro: 'O teto diário deve ser maior ou igual ao valor da hora.' }

  const estrategia = CRIAR_ESTRATEGIA[tipo]({ tipo, valor, valorMaximoDiario: teto })
  return { tarifa: new Tarifa('', nome, estrategia), ativa: corpo.active }
}

export function criarRotasTarifas(db: Banco): Router {
  const rotas = Router()

  // READ — tarifas do tenant (a ativa primeiro)
  rotas.get('/', (req, res) => {
    const tenant = lerTenantComCobranca(req, res)
    if (!tenant) return
    const linhas = db.prepare('SELECT * FROM tarifas WHERE tenant_id = ? ORDER BY ativa DESC, id').all(tenant) as LinhaTarifa[]
    res.json(linhas.map((linha) => paraJson(paraTarifa(linha), linha.ativa === 1)))
  })

  // CREATE — se nascer ativa, desativa a anterior na mesma transação
  rotas.post('/', (req, res) => {
    const tenant = lerTenantComCobranca(req, res)
    if (!tenant) return
    const { tarifa, ativa, erro } = validar(req.body ?? {})
    if (!tarifa) {
      res.status(400).json({ erro })
      return
    }

    const configuracao = configuracaoDaEstrategia(tarifa.estrategia)
    const salvar = db.transaction(() => {
      if (ativa) db.prepare('UPDATE tarifas SET ativa = 0 WHERE tenant_id = ?').run(tenant)
      return db.prepare(`
        INSERT INTO tarifas (tenant_id, nome, tipo_estrategia, valor, valor_maximo_diario, ativa)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(tenant, tarifa.nome, configuracao.tipo, configuracao.valor, configuracao.valorMaximoDiario, ativa ? 1 : 0)
    })
    const resultado = salvar()
    const criada = db.prepare('SELECT * FROM tarifas WHERE id = ?').get(resultado.lastInsertRowid) as LinhaTarifa
    res.status(201).json(paraJson(paraTarifa(criada), criada.ativa === 1))
  })

  // UPDATE — editar ou ativar; ativar desativa a anterior na mesma transação
  rotas.put('/:id', (req, res) => {
    const tenant = lerTenantComCobranca(req, res)
    if (!tenant) return
    const { tarifa, ativa, erro } = validar(req.body ?? {})
    if (!tarifa) {
      res.status(400).json({ erro })
      return
    }
    const existe = db.prepare('SELECT id FROM tarifas WHERE id = ? AND tenant_id = ?').get(req.params.id, tenant)
    if (!existe) {
      res.status(404).json({ erro: 'Tarifa não encontrada.' })
      return
    }

    const configuracao = configuracaoDaEstrategia(tarifa.estrategia)
    const salvar = db.transaction(() => {
      if (ativa) db.prepare('UPDATE tarifas SET ativa = 0 WHERE tenant_id = ? AND id <> ?').run(tenant, req.params.id)
      db.prepare(`
        UPDATE tarifas SET nome = ?, tipo_estrategia = ?, valor = ?, valor_maximo_diario = ?, ativa = ?
        WHERE id = ? AND tenant_id = ?
      `).run(tarifa.nome, configuracao.tipo, configuracao.valor, configuracao.valorMaximoDiario, ativa ? 1 : 0, req.params.id, tenant)
    })
    salvar()
    const atualizada = db.prepare('SELECT * FROM tarifas WHERE id = ?').get(req.params.id) as LinhaTarifa
    res.json(paraJson(paraTarifa(atualizada), atualizada.ativa === 1))
  })

  // DELETE — a tarifa ativa não pode ser excluída
  rotas.delete('/:id', (req, res) => {
    const tenant = lerTenantComCobranca(req, res)
    if (!tenant) return
    const linha = db.prepare('SELECT * FROM tarifas WHERE id = ? AND tenant_id = ?').get(req.params.id, tenant) as LinhaTarifa | undefined
    if (!linha) {
      res.status(404).json({ erro: 'Tarifa não encontrada.' })
      return
    }
    if (linha.ativa === 1) {
      res.status(409).json({ erro: `A tarifa ${linha.nome} está ativa. Ative outra tarifa ou desative esta antes de excluir.` })
      return
    }
    db.prepare('DELETE FROM tarifas WHERE id = ? AND tenant_id = ?').run(req.params.id, tenant)
    res.status(204).end()
  })

  return rotas
}
