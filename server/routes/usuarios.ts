import { Router } from 'express'
import { PERSON_TYPE_LABELS, ROLE_LABELS, TENANTS } from '../../src/core/config'
import type { PersonType, Role, TenantId } from '../../src/core/types'
import { Usuario } from '../../src/domain/Usuario'
import type { Banco } from '../database/conexao'
import { enviarErro, erroSqlite, lerTenant, texto } from './comum'

/** Formato de uma linha da tabela usuarios. */
interface LinhaUsuario {
  id: number
  tenant_id: string
  nome: string
  documento: string
  tipo: PersonType
  perfil: Role
  ativo: number // SQLite guarda booleano como 0 ou 1
}

/** Converte a linha do banco para o formato User do frontend (core/types.ts). */
function paraJson(linha: LinhaUsuario) {
  return {
    id: String(linha.id),
    name: linha.nome,
    document: linha.documento,
    type: linha.tipo,
    role: linha.perfil,
    active: linha.ativo === 1,
  }
}



/**
 * Valida o corpo do pedido e devolve um objeto Usuario do domínio.
 * Tipo e perfil permitidos dependem do tenant (personTypes e allowedRoles em TENANTS),
 * por isso essa regra fica aqui, e não dentro da classe Usuario.
 */
function validar(corpo: Record<string, unknown>, tenant: TenantId): { usuario?: Usuario; erro?: string } {
  const configuracao = TENANTS[tenant]
  const nome = texto(corpo.name)
  const documento = texto(corpo.document)
  const tipo = texto(corpo.type) as PersonType
  const perfil = texto(corpo.role) as Role

  if (!nome) return { erro: 'Informe o campo Nome.' }
  if (!documento) return { erro: 'Informe o campo Documento.' }
  if (!configuracao.personTypes.includes(tipo)) {
    const permitidos = configuracao.personTypes.map((item) => PERSON_TYPE_LABELS[item]).join(', ')
    return { erro: `Tipo de pessoa não permitido em ${configuracao.name}. Use: ${permitidos}.` }
  }
  if (!configuracao.allowedRoles.includes(perfil)) {
    const permitidos = configuracao.allowedRoles.map((item) => ROLE_LABELS[item]).join(', ')
    return { erro: `Perfil não permitido em ${configuracao.name}. Use: ${permitidos}.` }
  }
  if (typeof corpo.active !== 'boolean') return { erro: 'Informe se a pessoa está ativa.' }

  return { usuario: new Usuario('', nome, documento, perfil, tipo, tenant, corpo.active) }
}


export function criarRotasUsuarios(db: Banco): Router {
  const rotas = Router()

  // READ — lista apenas as pessoas do tenant informado
  rotas.get('/', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const linhas = db.prepare('SELECT * FROM usuarios WHERE tenant_id = ? ORDER BY nome').all(tenant) as LinhaUsuario[]
    res.json(linhas.map(paraJson))
  })

  // CREATE
  rotas.post('/', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const { usuario, erro } = validar(req.body ?? {}, tenant)
    if (!usuario) return enviarErro(res, 400, erro)

    try {
      const resultado = db.prepare(`
        INSERT INTO usuarios (tenant_id, nome, documento, tipo, perfil, ativo)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(tenant, usuario.nome, usuario.documento, usuario.tipo, usuario.perfil, usuario.ativo ? 1 : 0)
      const criado = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(resultado.lastInsertRowid) as LinhaUsuario
      res.status(201).json(paraJson(criado))
    } catch (falha) {
      if (!erroSqlite(falha, 'UNIQUE')) throw falha
      res.status(409).json({ erro: `Já existe uma pessoa com o documento ${usuario.documento} neste cliente.` })
    }
  })

  // UPDATE — o WHERE com tenant_id impede alterar pessoa de outro cliente
  rotas.put('/:id', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const { usuario, erro } = validar(req.body ?? {}, tenant)
    if (!usuario) return enviarErro(res, 400, erro)

    try {
      const resultado = db.prepare(`
        UPDATE usuarios SET nome = ?, documento = ?, tipo = ?, perfil = ?, ativo = ?
        WHERE id = ? AND tenant_id = ?
      `).run(usuario.nome, usuario.documento, usuario.tipo, usuario.perfil, usuario.ativo ? 1 : 0, req.params.id, tenant)
      if (resultado.changes === 0) return enviarErro(res, 404, 'Pessoa não encontrada.')
      const atualizado = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id) as LinhaUsuario
      res.json(paraJson(atualizado))
    } catch (falha) {
      if (!erroSqlite(falha, 'UNIQUE')) throw falha
      res.status(409).json({ erro: `Já existe uma pessoa com o documento ${usuario.documento} neste cliente.` })
    }
  })

  // DELETE — também filtrado por tenant_id
  rotas.delete('/:id', (req, res) => {
    const tenant = lerTenant(req, res)
    if (!tenant) return
    const resultado = db.prepare('DELETE FROM usuarios WHERE id = ? AND tenant_id = ?').run(req.params.id, tenant)
    if (resultado.changes === 0) return enviarErro(res, 404, 'Pessoa não encontrada.')
    res.status(204).end()
  })

  return rotas
}
