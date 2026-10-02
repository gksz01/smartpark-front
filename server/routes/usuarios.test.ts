// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { criarApp } from '../app'
import { abrirBanco, type Banco } from '../database/conexao'
import { popularBanco, popularTabelasVazias } from '../seed/seed'

let db: Banco
let app: ReturnType<typeof criarApp>

beforeEach(() => {
  db = abrirBanco(':memory:') // SQLite real, mas temporário
  popularBanco(db)
  app = criarApp(db)
})

afterEach(() => db.close())

const novaPaciente = { name: 'Ana Prado', document: '111.222.333-44', type: 'paciente', role: 'driver', active: true }

function linhaDoBanco(documento: string, tenant: string) {
  return db.prepare('SELECT * FROM usuarios WHERE documento = ? AND tenant_id = ?').get(documento, tenant) as Record<string, unknown> | undefined
}

describe('API de usuários — CRUD no SQLite', () => {
  it('READ: lista as pessoas do tenant em ordem alfabética', async () => {
    const resposta = await request(app).get('/api/users?tenant=hospital')
    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual([
      { id: '7', name: 'Beatriz Souza', document: '789.012.345-67', type: 'acompanhante', role: 'visitor', active: true },
      { id: '6', name: 'Helena Moreira', document: '678.901.234-56', type: 'paciente', role: 'driver', active: true },
    ])
  })

  it('CREATE: grava a pessoa no banco (ativo como 0/1)', async () => {
    const resposta = await request(app).post('/api/users?tenant=hospital').send({ ...novaPaciente, name: '  Ana Prado  ', active: false })
    expect(resposta.status).toBe(201)
    expect(resposta.body).toMatchObject({ name: 'Ana Prado', type: 'paciente', active: false })
    expect(linhaDoBanco('111.222.333-44', 'hospital')).toMatchObject({ nome: 'Ana Prado', tipo: 'paciente', perfil: 'driver', ativo: 0 })
  })

  it('UPDATE: altera o registro no banco', async () => {
    // id 6 = Helena Moreira (Hospital)
    const resposta = await request(app).put('/api/users/6?tenant=hospital').send({ ...novaPaciente, name: 'Helena M. Moreira', document: '678.901.234-56', type: 'acompanhante', role: 'visitor', active: false })
    expect(resposta.status).toBe(200)
    expect(linhaDoBanco('678.901.234-56', 'hospital')).toMatchObject({ id: 6, nome: 'Helena M. Moreira', tipo: 'acompanhante', perfil: 'visitor', ativo: 0 })
  })

  it('DELETE: remove o registro do banco', async () => {
    const resposta = await request(app).delete('/api/users/6?tenant=hospital')
    expect(resposta.status).toBe(204)
    expect(linhaDoBanco('678.901.234-56', 'hospital')).toBeUndefined()
  })

  it('os dados continuam no arquivo SQLite depois de fechar e reabrir o banco', async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'smartpark-'))
    const arquivo = join(pasta, 'teste.db')
    try {
      const bancoArquivo = abrirBanco(arquivo)
      await request(criarApp(bancoArquivo)).post('/api/users?tenant=condominium').send({ ...novaPaciente, type: 'morador', role: 'resident' })
      bancoArquivo.close()

      const reaberto = abrirBanco(arquivo)
      const resposta = await request(criarApp(reaberto)).get('/api/users?tenant=condominium')
      reaberto.close()
      expect(resposta.body).toEqual([expect.objectContaining({ name: 'Ana Prado', type: 'morador' })])
    } finally {
      rmSync(pasta, { recursive: true, force: true })
    }
  })
})

describe('API de usuários — multi-tenant', () => {
  it('cada tenant recebe apenas as suas pessoas', async () => {
    const condominio = await request(app).get('/api/users?tenant=condominium')
    const empresa = await request(app).get('/api/users?tenant=company')
    expect(condominio.body.map((pessoa: { name: string }) => pessoa.name)).toEqual(['Carlos Nunes', 'Juliana Reis'])
    expect(empresa.body.map((pessoa: { name: string }) => pessoa.name)).toEqual(['Diego Ramos', 'Lucas Martins'])
  })

  it('não altera nem exclui pessoa de outro tenant', async () => {
    // id 6 pertence ao Hospital; a Empresa tenta alterar e excluir
    const alteracao = await request(app).put('/api/users/6?tenant=company').send({ ...novaPaciente, type: 'funcionario', role: 'employee' })
    const exclusao = await request(app).delete('/api/users/6?tenant=company')
    expect(alteracao.status).toBe(404)
    expect(exclusao.status).toBe(404)
    expect(linhaDoBanco('678.901.234-56', 'hospital')).toMatchObject({ nome: 'Helena Moreira' })
  })

  it('exige um tenant válido', async () => {
    expect((await request(app).get('/api/users')).status).toBe(400)
    expect((await request(app).post('/api/users?tenant=aeroporto').send(novaPaciente)).status).toBe(400)
  })

  it('o mesmo documento é permitido em tenants diferentes, mas não no mesmo tenant', async () => {
    const outroTenant = await request(app).post('/api/users?tenant=company').send({ ...novaPaciente, document: '678.901.234-56', type: 'visitante', role: 'visitor' })
    const mesmoTenant = await request(app).post('/api/users?tenant=hospital').send({ ...novaPaciente, document: '678.901.234-56' })
    expect(outroTenant.status).toBe(201)
    expect(mesmoTenant.status).toBe(409)
  })
})

describe('API de usuários — validações da LPS', () => {
  it('rejeita tipo de pessoa que não pertence ao tenant (personTypes)', async () => {
    // "morador" existe no Condomínio, mas não no Hospital
    const resposta = await request(app).post('/api/users?tenant=hospital').send({ ...novaPaciente, type: 'morador' })
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro).toBe('Tipo de pessoa não permitido em Hospital Santa Clara. Use: Paciente, Acompanhante.')
    expect(linhaDoBanco('111.222.333-44', 'hospital')).toBeUndefined()
  })

  it('rejeita perfil que não pertence ao tenant (allowedRoles)', async () => {
    // "valet" (Manobrista) só existe no Shopping
    const resposta = await request(app).post('/api/users?tenant=hospital').send({ ...novaPaciente, role: 'valet' })
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro).toMatch('Perfil não permitido em Hospital Santa Clara.')
  })

  it('exige nome, documento e ativo', async () => {
    const semNome = await request(app).post('/api/users?tenant=hospital').send({ ...novaPaciente, name: ' ' })
    const semDocumento = await request(app).post('/api/users?tenant=hospital').send({ ...novaPaciente, document: '' })
    const semAtivo = await request(app).post('/api/users?tenant=hospital').send({ ...novaPaciente, active: 'sim' })
    expect(semNome.body.erro).toBe('Informe o campo Nome.')
    expect(semDocumento.body.erro).toBe('Informe o campo Documento.')
    expect(semAtivo.body.erro).toBe('Informe se a pessoa está ativa.')
  })
})

describe('seed de usuários', () => {
  it('/api/reset restaura também as pessoas', async () => {
    await request(app).delete('/api/users/6?tenant=hospital')
    await request(app).post('/api/reset')
    expect(linhaDoBanco('678.901.234-56', 'hospital')).toMatchObject({ id: 6, nome: 'Helena Moreira' })
  })

  it('um banco antigo, só com veículos, ganha os usuários ao iniciar sem perder os veículos', () => {
    const antigo = abrirBanco(':memory:')
    antigo.prepare("INSERT INTO veiculos (tenant_id, apelido, placa, modelo, cor) VALUES ('shopping', 'Meu', 'ABC1234', 'Gol', 'Prata')").run()

    expect(popularTabelasVazias(antigo)).toEqual(['usuarios'])
    const veiculos = antigo.prepare('SELECT COUNT(*) AS total FROM veiculos').get() as { total: number }
    const usuarios = antigo.prepare('SELECT COUNT(*) AS total FROM usuarios').get() as { total: number }
    antigo.close()
    expect(veiculos.total).toBe(1)
    expect(usuarios.total).toBe(9)
  })
})
