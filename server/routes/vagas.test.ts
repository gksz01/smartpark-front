// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CRIADOR_POR_TIPO } from '../../src/domain/factories/vaga/criadorPorTipo'
import { criarApp } from '../app'
import { abrirBanco, type Banco } from '../database/conexao'
import { popularBanco } from '../seed/seed'

let db: Banco
let app: ReturnType<typeof criarApp>

beforeEach(() => {
  db = abrirBanco(':memory:') // SQLite real, mas temporário
  popularBanco(db)
  app = criarApp(db)
})

afterEach(() => {
  db.close()
  vi.restoreAllMocks()
})

const novaVaga = { code: 'c-30', sector: 'C', type: 'Elétrico', status: 'Livre' }

function linhaDoBanco(codigo: string, tenant: string) {
  return db.prepare('SELECT * FROM vagas WHERE codigo = ? AND tenant_id = ?').get(codigo, tenant) as Record<string, unknown> | undefined
}

function idDa(codigo: string, tenant: string): number {
  return linhaDoBanco(codigo, tenant)?.id as number
}

describe('API de vagas — CRUD no SQLite', () => {
  it('READ: lista as vagas do tenant com o requisito da subclasse', async () => {
    const resposta = await request(app).get('/api/spaces?tenant=hospital')
    expect(resposta.status).toBe(200)
    expect(resposta.body.map((vaga: { code: string }) => vaga.code)).toEqual(['C-10', 'C-11', 'P-01', 'P-02', 'P-03'])
    expect(resposta.body.find((vaga: { code: string }) => vaga.code === 'P-01')).toEqual({
      id: String(idDa('P-01', 'hospital')), code: 'P-01', sector: 'Pronto-socorro', type: 'Prioritária', status: 'Ocupada',
      requirement: 'Exclusiva para pacientes e acompanhantes',
    })
  })

  it('CREATE: grava a vaga com o código em maiúsculas', async () => {
    const resposta = await request(app).post('/api/spaces?tenant=shopping').send(novaVaga)
    expect(resposta.status).toBe(201)
    expect(resposta.body).toMatchObject({ code: 'C-30', type: 'Elétrico', requirement: 'Exclusiva para veículos elétricos em recarga' })
    expect(linhaDoBanco('C-30', 'shopping')).toMatchObject({ setor: 'C', tipo: 'Elétrico', status: 'Livre' })
  })

  it('UPDATE: altera código, setor, tipo e status no banco', async () => {
    const id = idDa('A-01', 'shopping')
    const resposta = await request(app).put(`/api/spaces/${id}?tenant=shopping`).send({ code: 'A-10', sector: 'Térreo', type: 'PCD', status: 'Bloqueada' })
    expect(resposta.status).toBe(200)
    expect(resposta.body.requirement).toBe('Exige credencial PCD visível no veículo') // agora é uma VagaPCD
    expect(linhaDoBanco('A-01', 'shopping')).toBeUndefined()
    expect(linhaDoBanco('A-10', 'shopping')).toMatchObject({ id, setor: 'Térreo', tipo: 'PCD', status: 'Bloqueada' })
  })

  it('DELETE: remove vagas Livres e Bloqueadas', async () => {
    const livre = await request(app).delete(`/api/spaces/${idDa('A-01', 'shopping')}?tenant=shopping`)
    const bloqueada = await request(app).delete(`/api/spaces/${idDa('A-04', 'shopping')}?tenant=shopping`)
    expect(livre.status).toBe(204)
    expect(bloqueada.status).toBe(204)
    expect(linhaDoBanco('A-01', 'shopping')).toBeUndefined()
    expect(linhaDoBanco('A-04', 'shopping')).toBeUndefined()
  })

  it('os dados continuam no arquivo SQLite depois de fechar e reabrir o banco', async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'smartpark-'))
    const arquivo = join(pasta, 'teste.db')
    try {
      const bancoArquivo = abrirBanco(arquivo)
      await request(criarApp(bancoArquivo)).post('/api/spaces?tenant=company').send({ ...novaVaga, type: 'Restrito' })
      bancoArquivo.close()

      const reaberto = abrirBanco(arquivo)
      const resposta = await request(criarApp(reaberto)).get('/api/spaces?tenant=company')
      reaberto.close()
      expect(resposta.body).toEqual([expect.objectContaining({ code: 'C-30', type: 'Restrito' })])
    } finally {
      rmSync(pasta, { recursive: true, force: true })
    }
  })
})

describe('API de vagas — Factory Method no fluxo', () => {
  it('o CREATE usa o Creator do tipo escolhido', async () => {
    const espiao = vi.spyOn(CRIADOR_POR_TIPO['Prioritária'], 'criarVaga')
    await request(app).post('/api/spaces?tenant=hospital').send({ ...novaVaga, type: 'Prioritária' })
    expect(espiao).toHaveBeenCalledWith('', 'C-30', 'C')
    expect(espiao.mock.results[0].value.constructor.name).toBe('VagaPrioritaria')
  })

  it('cada tipo devolve o requisito da sua subclasse', async () => {
    const empresa = await request(app).get('/api/spaces?tenant=company')
    const condominio = await request(app).get('/api/spaces?tenant=condominium')
    expect(empresa.body.find((vaga: { type: string }) => vaga.type === 'Restrito').requirement).toBe('Exclusiva para credenciais autorizadas')
    expect(condominio.body.find((vaga: { type: string }) => vaga.type === 'Nominal').requirement).toBe('Exclusiva do morador da unidade vinculada')
  })
})

describe('API de vagas — multi-tenant', () => {
  it('cada tenant recebe apenas as suas vagas', async () => {
    const condominio = await request(app).get('/api/spaces?tenant=condominium')
    expect(condominio.body.map((vaga: { code: string }) => vaga.code)).toEqual(['T1-101', 'T1-102', 'T2-804', 'V-01', 'V-02'])
  })

  it('não altera nem exclui vaga de outro tenant', async () => {
    const id = idDa('A-01', 'shopping')
    const alteracao = await request(app).put(`/api/spaces/${id}?tenant=hospital`).send({ ...novaVaga, type: 'Comum' })
    const exclusao = await request(app).delete(`/api/spaces/${id}?tenant=hospital`)
    expect(alteracao.status).toBe(404)
    expect(exclusao.status).toBe(404)
    expect(linhaDoBanco('A-01', 'shopping')).toMatchObject({ tipo: 'Comum', status: 'Livre' })
  })

  it('exige um tenant válido', async () => {
    expect((await request(app).get('/api/spaces')).status).toBe(400)
  })

  it('o mesmo código é permitido em tenants diferentes, mas não no mesmo tenant', async () => {
    const outroTenant = await request(app).post('/api/spaces?tenant=company').send({ ...novaVaga, code: 'A-01' })
    const mesmoTenant = await request(app).post('/api/spaces?tenant=shopping').send({ ...novaVaga, code: 'a-01' })
    expect(outroTenant.status).toBe(201)
    expect(mesmoTenant.status).toBe(409)
    expect(mesmoTenant.body.erro).toBe('Já existe uma vaga com o código A-01 neste cliente.')
  })
})

describe('API de vagas — validações', () => {
  it('rejeita tipo que não pertence ao spaceTypes do tenant', async () => {
    // Prioritária é exclusiva do Hospital
    const resposta = await request(app).post('/api/spaces?tenant=shopping').send({ ...novaVaga, type: 'Prioritária' })
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro).toBe('Tipo de vaga não permitido em Shopping Center Aurora. Use: Comum, PCD, Elétrico.')
    expect(linhaDoBanco('C-30', 'shopping')).toBeUndefined()
  })

  it('rejeita status inválido', async () => {
    const resposta = await request(app).post('/api/spaces?tenant=shopping').send({ ...novaVaga, status: 'Interditada' })
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro).toBe('Status inválido. Use: Livre, Ocupada, Bloqueada, Reservada.')
  })

  it('exige código e setor', async () => {
    const semCodigo = await request(app).post('/api/spaces?tenant=shopping').send({ ...novaVaga, code: ' ' })
    const semSetor = await request(app).post('/api/spaces?tenant=shopping').send({ ...novaVaga, sector: '' })
    expect(semCodigo.body.erro).toBe('Informe o campo Código.')
    expect(semSetor.body.erro).toBe('Informe o campo Setor.')
  })
})

describe('API de vagas — regra de exclusão', () => {
  it('não exclui vaga Ocupada', async () => {
    const resposta = await request(app).delete(`/api/spaces/${idDa('A-02', 'shopping')}?tenant=shopping`)
    expect(resposta.status).toBe(409)
    expect(resposta.body.erro).toBe('A vaga A-02 está Ocupada e não pode ser excluída. Libere ou bloqueie a vaga antes.')
    expect(linhaDoBanco('A-02', 'shopping')).toBeDefined()
  })

  it('não exclui vaga Reservada', async () => {
    const resposta = await request(app).delete(`/api/spaces/${idDa('A-03', 'shopping')}?tenant=shopping`)
    expect(resposta.status).toBe(409)
    expect(resposta.body.erro).toMatch('está Reservada')
    expect(linhaDoBanco('A-03', 'shopping')).toBeDefined()
  })

  it('/api/reset restaura também as vagas', async () => {
    await request(app).delete(`/api/spaces/${idDa('A-01', 'shopping')}?tenant=shopping`)
    await request(app).post('/api/reset')
    expect(linhaDoBanco('A-01', 'shopping')).toMatchObject({ id: 1, tipo: 'Comum' })
  })
})
