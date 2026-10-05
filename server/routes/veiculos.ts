import { Router, type Request, type Response } from 'express'
import { isTenantId, TENANTS } from '../../src/core/config'
import type { TenantId } from '../../src/core/types'
import { Veiculo } from '../../src/domain/Veiculo'
import type { Banco } from '../database/conexao'

/** Formato de uma linha da tabela veiculos. */
interface LinhaVeiculo {
  id: number
  tenant_id: string
  apelido: string
  placa: string
  modelo: string
  cor: string
  unidade: string | null
  tag_rfid: string | null
}

/** Converte a linha do banco para o formato Vehicle que o frontend já usa (core/types.ts). */
function paraJson(linha: LinhaVeiculo) {
  return {
    id: String(linha.id),
    nickname: linha.apelido,
    plate: linha.placa,
    model: linha.modelo,
    color: linha.cor,
    unit: linha.unidade ?? '',
    rfidTag: linha.tag_rfid ?? '',
  }
}

/** Todo pedido precisa informar o cliente: /api/vehicles?tenant=shopping */
function lerTenant(req: Request, res: Response): TenantId | null {
  const tenant = req.query.tenant
  if (typeof tenant !== 'string' || !isTenantId(tenant)) {
    res.status(400).json({ erro: 'Informe um tenant válido em ?tenant=' })
    return null
  }
  return tenant
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

/**
 * Valida o corpo do pedido e devolve um objeto Veiculo do domínio.
 * Campos variáveis (unidade, tag RFID) são obrigatórios conforme vehicleFields do tenant.
 */
function validar(corpo: Record<string, unknown>, tenant: TenantId): { veiculo?: Veiculo; erro?: string } {
  const obrigatorios = { nickname: 'Apelido', plate: 'Placa', model: 'Modelo', color: 'Cor' }
  for (const [campo, rotulo] of Object.entries(obrigatorios)) {
    if (!texto(corpo[campo])) return { erro: `Informe o campo ${rotulo}.` }
  }
  for (const campo of TENANTS[tenant].vehicleFields) {
    if (!texto(corpo[campo.key])) return { erro: `Informe o campo ${campo.label}.` }
  }

  const veiculo = new Veiculo('', texto(corpo.plate), texto(corpo.model), texto(corpo.color), texto(corpo.nickname), undefined, texto(corpo.rfidTag), texto(corpo.unit))
  if (!veiculo.validarPlaca()) return { erro: 'Placa inválida. Use o padrão ABC1234 ou ABC1D23.' }
  return { veiculo }
}

function placaRepetida(erro: unknown): boolean {
  return erro instanceof Error && 'code' in erro && erro.code === 'SQLITE_CONSTRAINT_UNIQUE'
}

export function criarRotasVeiculos(db: Banco): Router {
  const rotas = Router()

  // READ — lista apenas os veículos do tenant informado
  rotas.get('/', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const linhas = db.prepare('SELECT * FROM veiculos WHERE tenant_id = ? ORDER BY id').all(tenant) as LinhaVeiculo[]
    res.json(linhas.map(paraJson))
  })

  // CREATE
  rotas.post('/', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const { veiculo, erro } = validar(req.body ?? {}, tenant)
    if (!veiculo) {
      res.status(400).json({ erro })
      return
    }

    try {
      const resultado = db.prepare(`
        INSERT INTO veiculos (tenant_id, apelido, placa, modelo, cor, unidade, tag_rfid)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(tenant, veiculo.apelido, veiculo.placaNormalizada(), veiculo.modelo, veiculo.cor, veiculo.unidade || null, veiculo.tagRfid || null)
      const criado = db.prepare('SELECT * FROM veiculos WHERE id = ?').get(resultado.lastInsertRowid) as LinhaVeiculo
      res.status(201).json(paraJson(criado))
    } catch (falha) {
      if (!placaRepetida(falha)) throw falha
      res.status(409).json({ erro: `Já existe um veículo com a placa ${veiculo.placaNormalizada()} neste cliente.` })
    }
  })

  // UPDATE — o WHERE com tenant_id impede alterar veículo de outro cliente
  rotas.put('/:id', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const { veiculo, erro } = validar(req.body ?? {}, tenant)
    if (!veiculo) {
      res.status(400).json({ erro })
      return
    }

    try {
      const resultado = db.prepare(`
        UPDATE veiculos SET apelido = ?, placa = ?, modelo = ?, cor = ?, unidade = ?, tag_rfid = ?
        WHERE id = ? AND tenant_id = ?
      `).run(veiculo.apelido, veiculo.placaNormalizada(), veiculo.modelo, veiculo.cor, veiculo.unidade || null, veiculo.tagRfid || null, req.params.id, tenant)
      if (resultado.changes === 0) {
        res.status(404).json({ erro: 'Veículo não encontrado.' })
        return
      }
      const atualizado = db.prepare('SELECT * FROM veiculos WHERE id = ?').get(req.params.id) as LinhaVeiculo
      res.json(paraJson(atualizado))
    } catch (falha) {
      if (!placaRepetida(falha)) throw falha
      res.status(409).json({ erro: `Já existe um veículo com a placa ${veiculo.placaNormalizada()} neste cliente.` })
    }
  })

  // DELETE — também filtrado por tenant_id
  rotas.delete('/:id', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    let resultado
    try {
      resultado = db.prepare('DELETE FROM veiculos WHERE id = ? AND tenant_id = ?').run(req.params.id, tenant)
    } catch (falha) {
      // Foreign key: o veículo ainda é usado por reservas ou pagamentos
      if (!(falha instanceof Error && 'code' in falha && falha.code === 'SQLITE_CONSTRAINT_FOREIGNKEY')) throw falha
      const { reservas } = db.prepare('SELECT COUNT(*) AS reservas FROM reservas WHERE veiculo_id = ?').get(req.params.id) as { reservas: number }
      res.status(409).json({
        erro: reservas > 0 ? 'Este veículo possui reservas. Exclua as reservas dele antes.' : 'Este veículo possui pagamentos registrados. Exclua os pagamentos dele antes.',
      })
      return
    }
    if (resultado.changes === 0) {
      res.status(404).json({ erro: 'Veículo não encontrado.' })
      return
    }
    res.status(204).end()
  })

  return rotas
}
