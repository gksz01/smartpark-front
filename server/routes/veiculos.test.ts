// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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

afterEach(() => db.close())

const novoVeiculo = { nickname: 'Trabalho', plate: 'abc-1234', model: 'Corolla', color: 'Preto' }

function linhaDoBanco(placa: string, tenant: string) {
  return db.prepare('SELECT * FROM veiculos WHERE placa = ? AND tenant_id = ?').get(placa, tenant) as Record<string, unknown> | undefined
}

describe('API de veículos — CRUD no SQLite', () => {
  it('READ: lista os veículos do tenant', async () => {
    const resposta = await request(app).get('/api/vehicles?tenant=shopping')
    expect(resposta.status).toBe(200)
    expect(resposta.body.map((veiculo: { plate: string }) => veiculo.plate)).toEqual(['SPK1A23', 'BRA2E19'])
    expect(resposta.body[0]).toEqual({ id: '1', nickname: 'Meu carro', plate: 'SPK1A23', model: 'Honda City', color: 'Cinza', unit: '', rfidTag: '' })
  })

  it('CREATE: grava no banco com a placa normalizada', async () => {
    const resposta = await request(app).post('/api/vehicles?tenant=hospital').send(novoVeiculo)
    expect(resposta.status).toBe(201)
    expect(resposta.body.plate).toBe('ABC1234')

    const linha = linhaDoBanco('ABC1234', 'hospital')
    expect(linha).toMatchObject({ apelido: 'Trabalho', modelo: 'Corolla', cor: 'Preto', tenant_id: 'hospital' })
  })

  it('UPDATE: altera o registro no banco', async () => {
    const resposta = await request(app).put('/api/vehicles/1?tenant=shopping').send({ ...novoVeiculo, plate: 'SPK1A23', model: 'Honda Civic' })
    expect(resposta.status).toBe(200)
    expect(resposta.body.model).toBe('Honda Civic')
    expect(linhaDoBanco('SPK1A23', 'shopping')).toMatchObject({ id: 1, modelo: 'Honda Civic', apelido: 'Trabalho' })
  })

  it('DELETE: remove o registro do banco', async () => {
    const resposta = await request(app).delete('/api/vehicles/1?tenant=shopping')
    expect(resposta.status).toBe(204)
    expect(linhaDoBanco('SPK1A23', 'shopping')).toBeUndefined()
    expect(linhaDoBanco('SPK1A23', 'condominium')).toBeDefined() // mesma placa em outro tenant continua
  })

  it('os dados continuam no arquivo SQLite depois de fechar e reabrir o banco', async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'smartpark-'))
    const arquivo = join(pasta, 'teste.db')
    try {
      const bancoArquivo = abrirBanco(arquivo)
      await request(criarApp(bancoArquivo)).post('/api/vehicles?tenant=company').send({ ...novoVeiculo, rfidTag: 'NX-00001' })
      bancoArquivo.close()

      const reaberto = abrirBanco(arquivo)
      const resposta = await request(criarApp(reaberto)).get('/api/vehicles?tenant=company')
      reaberto.close()
      expect(resposta.body).toEqual([expect.objectContaining({ plate: 'ABC1234', rfidTag: 'NX-00001' })])
    } finally {
      rmSync(pasta, { recursive: true, force: true })
    }
  })
})

describe('API de veículos — multi-tenant', () => {
  it('um tenant não recebe veículos de outro', async () => {
    const hospital = await request(app).get('/api/vehicles?tenant=hospital')
    const empresa = await request(app).get('/api/vehicles?tenant=company')
    expect(hospital.body.map((veiculo: { plate: string }) => veiculo.plate)).toEqual(['HSP2C34'])
    expect(empresa.body.map((veiculo: { plate: string }) => veiculo.plate)).toEqual(['SPK1A23', 'NXR5D67'])
  })

  it('não altera nem exclui veículo de outro tenant', async () => {
    // O veículo 1 pertence ao Shopping
    const alteracao = await request(app).put('/api/vehicles/1?tenant=hospital').send({ ...novoVeiculo, plate: 'SPK1A23' })
    const exclusao = await request(app).delete('/api/vehicles/1?tenant=hospital')
    expect(alteracao.status).toBe(404)
    expect(exclusao.status).toBe(404)
    expect(linhaDoBanco('SPK1A23', 'shopping')).toMatchObject({ id: 1, modelo: 'Honda City' })
  })

  it('exige um tenant válido', async () => {
    expect((await request(app).get('/api/vehicles')).status).toBe(400)
    expect((await request(app).get('/api/vehicles?tenant=aeroporto')).status).toBe(400)
  })

  it('a mesma placa é permitida em tenants diferentes, mas não no mesmo tenant', async () => {
    const outroTenant = await request(app).post('/api/vehicles?tenant=hospital').send({ ...novoVeiculo, plate: 'SPK1A23' })
    const mesmoTenant = await request(app).post('/api/vehicles?tenant=shopping').send({ ...novoVeiculo, plate: 'SPK1A23' })
    expect(outroTenant.status).toBe(201)
    expect(mesmoTenant.status).toBe(409)
    expect(mesmoTenant.body.erro).toMatch('Já existe um veículo com a placa SPK1A23')
  })
})

describe('API de veículos — validações', () => {
  it('rejeita placa inválida usando Veiculo.validarPlaca()', async () => {
    const resposta = await request(app).post('/api/vehicles?tenant=shopping').send({ ...novoVeiculo, plate: '12ABC34' })
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro).toBe('Placa inválida. Use o padrão ABC1234 ou ABC1D23.')
    expect(linhaDoBanco('12ABC34', 'shopping')).toBeUndefined()
  })

  it('rejeita campos obrigatórios vazios', async () => {
    const resposta = await request(app).post('/api/vehicles?tenant=shopping').send({ ...novoVeiculo, model: '  ' })
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro).toBe('Informe o campo Modelo.')
  })

  it('exige os campos variáveis do tenant (vehicleFields)', async () => {
    const condominio = await request(app).post('/api/vehicles?tenant=condominium').send(novoVeiculo)
    const empresa = await request(app).post('/api/vehicles?tenant=company').send(novoVeiculo)
    expect(condominio.body.erro).toBe('Informe o campo Unidade / apartamento.')
    expect(empresa.body.erro).toBe('Informe o campo Tag RFID.')
  })
})

describe('POST /api/reset', () => {
  it('restaura os veículos de demonstração', async () => {
    await request(app).delete('/api/vehicles/1?tenant=shopping')
    await request(app).post('/api/vehicles?tenant=shopping').send(novoVeiculo)

    const resposta = await request(app).post('/api/reset')
    const lista = await request(app).get('/api/vehicles?tenant=shopping')

    expect(resposta.status).toBe(200)
    expect(lista.body.map((veiculo: { id: string; plate: string }) => `${veiculo.id}:${veiculo.plate}`)).toEqual(['1:SPK1A23', '2:BRA2E19'])
  })
})
