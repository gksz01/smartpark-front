// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TarifaFixaDiaria } from '../../src/domain/strategies/tarifa/TarifaFixaDiaria'
import { TarifaIsenta } from '../../src/domain/strategies/tarifa/TarifaIsenta'
import { TarifaPorHora } from '../../src/domain/strategies/tarifa/TarifaPorHora'
import { CRIAR_ESTRATEGIA } from '../../src/domain/strategies/tarifa/estrategiaPorTipo'
import { Tarifa } from '../../src/domain/Tarifa'
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

const novaTarifa = { name: 'Noturna', strategy: 'POR_HORA', value: 8, maxDaily: 30, active: false }

interface Linha { id: number; tenant_id: string; nome: string; tipo_estrategia: 'POR_HORA' | 'DIARIA' | 'ISENTA'; valor: number; valor_maximo_diario: number | null; ativa: number }

function linhaPorNome(nome: string) {
  return db.prepare('SELECT * FROM tarifas WHERE nome = ?').get(nome) as Linha | undefined
}

function ativasDo(tenant: string) {
  return db.prepare('SELECT nome FROM tarifas WHERE tenant_id = ? AND ativa = 1').all(tenant) as { nome: string }[]
}

describe('API de tarifas — CRUD no SQLite', () => {
  it('READ: lista as tarifas do tenant, a ativa primeiro', async () => {
    const resposta = await request(app).get('/api/tariffs?tenant=shopping')
    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual([
      { id: '1', name: 'Tarifa Aurora', strategy: 'POR_HORA', value: 12, maxDaily: 60, active: true },
      { id: '3', name: 'Diária promocional', strategy: 'DIARIA', value: 40, maxDaily: null, active: false },
      { id: '4', name: 'Cortesia para lojistas', strategy: 'ISENTA', value: 0, maxDaily: null, active: false },
    ])
  })

  it('CREATE: grava a tarifa no banco', async () => {
    const resposta = await request(app).post('/api/tariffs?tenant=hospital').send(novaTarifa)
    expect(resposta.status).toBe(201)
    expect(resposta.body).toMatchObject({ name: 'Noturna', strategy: 'POR_HORA', value: 8, maxDaily: 30, active: false })
    expect(linhaPorNome('Noturna')).toMatchObject({ tenant_id: 'hospital', tipo_estrategia: 'POR_HORA', valor: 8, valor_maximo_diario: 30, ativa: 0 })
  })

  it('CREATE: a isenta é gravada com valor 0 e sem teto', async () => {
    await request(app).post('/api/tariffs?tenant=shopping').send({ name: 'Evento', strategy: 'ISENTA', value: 99, maxDaily: null, active: false })
    expect(linhaPorNome('Evento')).toMatchObject({ tipo_estrategia: 'ISENTA', valor: 0, valor_maximo_diario: null })
  })

  it('UPDATE: troca nome, Strategy e valores no banco', async () => {
    const id = linhaPorNome('Diária promocional')!.id
    const resposta = await request(app).put(`/api/tariffs/${id}?tenant=shopping`).send({ name: 'Hora econômica', strategy: 'POR_HORA', value: 5, maxDaily: null, active: false })
    expect(resposta.status).toBe(200)
    expect(db.prepare('SELECT * FROM tarifas WHERE id = ?').get(id)).toMatchObject({ nome: 'Hora econômica', tipo_estrategia: 'POR_HORA', valor: 5, valor_maximo_diario: null })
  })

  it('DELETE: exclui uma tarifa inativa', async () => {
    const id = linhaPorNome('Cortesia para lojistas')!.id
    const resposta = await request(app).delete(`/api/tariffs/${id}?tenant=shopping`)
    expect(resposta.status).toBe(204)
    expect(linhaPorNome('Cortesia para lojistas')).toBeUndefined()
  })

  it('os dados continuam no arquivo SQLite depois de fechar e reabrir o banco', async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'smartpark-'))
    const arquivo = join(pasta, 'teste.db')
    try {
      const bancoArquivo = abrirBanco(arquivo)
      await request(criarApp(bancoArquivo)).post('/api/tariffs?tenant=shopping').send({ ...novaTarifa, strategy: 'DIARIA', maxDaily: null })
      bancoArquivo.close()

      const reaberto = abrirBanco(arquivo)
      const resposta = await request(criarApp(reaberto)).get('/api/tariffs?tenant=shopping')
      reaberto.close()
      expect(resposta.body).toEqual([expect.objectContaining({ name: 'Noturna', strategy: 'DIARIA', value: 8 })])
    } finally {
      rmSync(pasta, { recursive: true, force: true })
    }
  })
})

describe('API de tarifas — Strategy reconstruída a partir do banco', () => {
  it('cada linha volta como Tarifa com a Strategy concreta correta', () => {
    const linhas = db.prepare("SELECT * FROM tarifas WHERE tenant_id = 'shopping' ORDER BY id").all() as Linha[]
    const tarifas = linhas.map((linha) => new Tarifa(String(linha.id), linha.nome, CRIAR_ESTRATEGIA[linha.tipo_estrategia]({ tipo: linha.tipo_estrategia, valor: linha.valor, valorMaximoDiario: linha.valor_maximo_diario })))

    expect(tarifas[0].estrategia).toBeInstanceOf(TarifaPorHora)
    expect(tarifas[1].estrategia).toBeInstanceOf(TarifaFixaDiaria)
    expect(tarifas[2].estrategia).toBeInstanceOf(TarifaIsenta)
    expect(tarifas.map((tarifa) => tarifa.calcular(3))).toEqual([36, 40, 0])
  })

  it('a tarifa padrão de cada tenant veio do Factory Method da variante', () => {
    expect(linhaPorNome('Tarifa Aurora')).toMatchObject({ tenant_id: 'shopping', tipo_estrategia: 'POR_HORA', valor: 12, valor_maximo_diario: 60, ativa: 1 })
    expect(linhaPorNome('Tarifa Santa Clara')).toMatchObject({ tenant_id: 'hospital', tipo_estrategia: 'POR_HORA', valor: 10, valor_maximo_diario: 50, ativa: 1 })
  })
})

describe('API de tarifas — uma única tarifa ativa', () => {
  it('ativar uma tarifa desativa a anterior', async () => {
    const id = linhaPorNome('Diária promocional')!.id
    await request(app).put(`/api/tariffs/${id}?tenant=shopping`).send({ name: 'Diária promocional', strategy: 'DIARIA', value: 40, maxDaily: null, active: true })
    expect(ativasDo('shopping')).toEqual([{ nome: 'Diária promocional' }])
  })

  it('criar uma tarifa já ativa também desativa a anterior', async () => {
    await request(app).post('/api/tariffs?tenant=hospital').send({ ...novaTarifa, active: true })
    expect(ativasDo('hospital')).toEqual([{ nome: 'Noturna' }])
    expect(ativasDo('shopping')).toEqual([{ nome: 'Tarifa Aurora' }]) // outro tenant não muda
  })

  it('o próprio banco recusa duas tarifas ativas no mesmo tenant', () => {
    expect(() => db.prepare("INSERT INTO tarifas (tenant_id, nome, tipo_estrategia, valor, ativa) VALUES ('shopping', 'Duplicada', 'ISENTA', 0, 1)").run()).toThrow(/UNIQUE/)
  })

  it('não exclui a tarifa ativa', async () => {
    const resposta = await request(app).delete(`/api/tariffs/${linhaPorNome('Tarifa Aurora')!.id}?tenant=shopping`)
    expect(resposta.status).toBe(409)
    expect(resposta.body.erro).toBe('A tarifa Tarifa Aurora está ativa. Ative outra tarifa ou desative esta antes de excluir.')
    expect(linhaPorNome('Tarifa Aurora')).toBeDefined()
  })

  it('depois de desativada, a tarifa pode ser excluída', async () => {
    const id = linhaPorNome('Tarifa Aurora')!.id
    await request(app).put(`/api/tariffs/${id}?tenant=shopping`).send({ name: 'Tarifa Aurora', strategy: 'POR_HORA', value: 12, maxDaily: 60, active: false })
    const resposta = await request(app).delete(`/api/tariffs/${id}?tenant=shopping`)
    expect(resposta.status).toBe(204)
  })
})

describe('API de tarifas — tenant e billing', () => {
  it('cada tenant recebe só as suas tarifas', async () => {
    const hospital = await request(app).get('/api/tariffs?tenant=hospital')
    expect(hospital.body.map((tarifa: { name: string }) => tarifa.name)).toEqual(['Tarifa Santa Clara', 'Diária de acompanhante'])
  })

  it('não altera nem exclui tarifa de outro tenant', async () => {
    const id = linhaPorNome('Diária promocional')!.id
    const alteracao = await request(app).put(`/api/tariffs/${id}?tenant=hospital`).send(novaTarifa)
    const exclusao = await request(app).delete(`/api/tariffs/${id}?tenant=hospital`)
    expect(alteracao.status).toBe(404)
    expect(exclusao.status).toBe(404)
    expect(linhaPorNome('Diária promocional')).toMatchObject({ tenant_id: 'shopping', valor: 40 })
  })

  it('exige um tenant válido', async () => {
    expect((await request(app).get('/api/tariffs')).status).toBe(400)
    expect((await request(app).get('/api/tariffs?tenant=aeroporto')).status).toBe(400)
  })

  it('bloqueia tenants com billing desligado em todas as operações', async () => {
    const leitura = await request(app).get('/api/tariffs?tenant=condominium')
    const criacao = await request(app).post('/api/tariffs?tenant=company').send(novaTarifa)
    const exclusao = await request(app).delete('/api/tariffs/1?tenant=company')
    expect(leitura.status).toBe(403)
    expect(leitura.body.erro).toBe('O módulo Cobrança individual não está disponível para Residencial Horizonte.')
    expect(criacao.status).toBe(403)
    expect(exclusao.status).toBe(403)
    expect(db.prepare("SELECT COUNT(*) AS total FROM tarifas WHERE tenant_id IN ('condominium', 'company')").get()).toEqual({ total: 0 })
  })
})

describe('API de tarifas — validações', () => {
  it('rejeita tipo de estratégia inválido', async () => {
    const resposta = await request(app).post('/api/tariffs?tenant=shopping').send({ ...novaTarifa, strategy: 'POR_MINUTO' })
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro).toBe('Tipo de cálculo inválido. Use: Por hora, Diária fixa, Isenta.')
  })

  it('rejeita valores incoerentes', async () => {
    const semValor = await request(app).post('/api/tariffs?tenant=shopping').send({ ...novaTarifa, value: 0 })
    const valorTexto = await request(app).post('/api/tariffs?tenant=shopping').send({ ...novaTarifa, value: 'doze' })
    const tetoMenor = await request(app).post('/api/tariffs?tenant=shopping').send({ ...novaTarifa, value: 10, maxDaily: 5 })
    const tetoNaDiaria = await request(app).post('/api/tariffs?tenant=shopping').send({ ...novaTarifa, strategy: 'DIARIA', maxDaily: 50 })
    expect(semValor.body.erro).toBe('Informe um valor maior que zero.')
    expect(valorTexto.body.erro).toBe('Informe um valor maior que zero.')
    expect(tetoMenor.body.erro).toBe('O teto diário deve ser maior ou igual ao valor da hora.')
    expect(tetoNaDiaria.body.erro).toBe('O teto diário só se aplica à tarifa por hora.')
  })

  it('exige nome e ativa', async () => {
    const semNome = await request(app).post('/api/tariffs?tenant=shopping').send({ ...novaTarifa, name: ' ' })
    const semAtiva = await request(app).post('/api/tariffs?tenant=shopping').send({ ...novaTarifa, active: 'sim' })
    expect(semNome.body.erro).toBe('Informe o campo Nome.')
    expect(semAtiva.body.erro).toBe('Informe se a tarifa está ativa.')
  })

  it('/api/reset restaura também as tarifas', async () => {
    await request(app).delete(`/api/tariffs/${linhaPorNome('Cortesia para lojistas')!.id}?tenant=shopping`)
    await request(app).post('/api/reset')
    expect(linhaPorNome('Cortesia para lojistas')).toMatchObject({ id: 4, ativa: 0 })
    expect(ativasDo('shopping')).toEqual([{ nome: 'Tarifa Aurora' }])
  })
})
