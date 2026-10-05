// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TENANTS } from '../../src/core/config'
import { Atendimento } from '../../src/domain/Atendimento'
import { Convenio } from '../../src/domain/Convenio'
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

const novoConvenio = { name: 'CuidarMais', benefitType: 'percentual', benefitValue: 25, active: true }

function convenioPorNome(nome: string) {
  return db.prepare('SELECT * FROM convenios WHERE nome = ?').get(nome) as { id: number; tenant_id: string; nome: string; tipo_beneficio: string; valor_beneficio: number; ativo: number } | undefined
}

function validar(numero: string, tenant = 'hospital') {
  return request(app).post(`/api/agreements/validate?tenant=${tenant}`).send({ number: numero })
}

describe('API de convênios — CRUD no SQLite', () => {
  it('READ: lista os convênios com a quantidade de atendimentos', async () => {
    const resposta = await request(app).get('/api/agreements?tenant=hospital')
    expect(resposta.status).toBe(200)
    expect(resposta.body.map((convenio: { name: string; attendanceCount: number }) => `${convenio.name}:${convenio.attendanceCount}`))
      .toEqual(['Bem Estar:1', 'MedSul:0', 'Plano Antigo:1', 'Saúde Plena:2', 'VidaCare:2'])
    expect(resposta.body.find((convenio: { name: string }) => convenio.name === 'VidaCare')).toMatchObject({ benefitType: 'percentual', benefitValue: 50, active: true })
  })

  it('CREATE: grava o convênio no banco', async () => {
    const resposta = await request(app).post('/api/agreements?tenant=hospital').send(novoConvenio)
    expect(resposta.status).toBe(201)
    expect(resposta.body).toMatchObject({ name: 'CuidarMais', benefitType: 'percentual', benefitValue: 25, active: true, attendanceCount: 0 })
    expect(convenioPorNome('CuidarMais')).toMatchObject({ tenant_id: 'hospital', tipo_beneficio: 'percentual', valor_beneficio: 25, ativo: 1 })
  })

  it('CREATE: a isenção é gravada com valor 0', async () => {
    await request(app).post('/api/agreements?tenant=hospital').send({ ...novoConvenio, benefitType: 'isencao', benefitValue: 80 })
    expect(convenioPorNome('CuidarMais')).toMatchObject({ tipo_beneficio: 'isencao', valor_beneficio: 0 })
  })

  it('UPDATE: altera tipo, valor e situação no banco', async () => {
    const id = convenioPorNome('Bem Estar')!.id
    const resposta = await request(app).put(`/api/agreements/${id}?tenant=hospital`).send({ name: 'Bem Estar', benefitType: 'horasGratis', benefitValue: 3, active: false })
    expect(resposta.status).toBe(200)
    expect(convenioPorNome('Bem Estar')).toMatchObject({ valor_beneficio: 3, ativo: 0 })
  })

  it('DELETE: exclui convênio sem atendimentos', async () => {
    const resposta = await request(app).delete(`/api/agreements/${convenioPorNome('MedSul')!.id}?tenant=hospital`)
    expect(resposta.status).toBe(204)
    expect(convenioPorNome('MedSul')).toBeUndefined()
  })

  it('DELETE: recusa convênio com atendimentos (409 com mensagem de negócio)', async () => {
    const resposta = await request(app).delete(`/api/agreements/${convenioPorNome('Saúde Plena')!.id}?tenant=hospital`)
    expect(resposta.status).toBe(409)
    expect(resposta.body.erro).toBe('O convênio Saúde Plena possui 2 atendimento(s) vinculado(s) e não pode ser excluído. Desative-o em vez de excluir.')
    expect(convenioPorNome('Saúde Plena')).toBeDefined()
  })

  it('os dados continuam no arquivo SQLite depois de fechar e reabrir o banco', async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'smartpark-'))
    const arquivo = join(pasta, 'teste.db')
    try {
      const bancoArquivo = abrirBanco(arquivo)
      await request(criarApp(bancoArquivo)).post('/api/agreements?tenant=hospital').send(novoConvenio)
      bancoArquivo.close()

      const reaberto = abrirBanco(arquivo)
      const resposta = await request(criarApp(reaberto)).get('/api/agreements?tenant=hospital')
      reaberto.close()
      expect(resposta.body).toEqual([expect.objectContaining({ name: 'CuidarMais', benefitValue: 25 })])
    } finally {
      rmSync(pasta, { recursive: true, force: true })
    }
  })
})

describe('API de convênios — validações', () => {
  it('exige nome, tipo válido e ativo', async () => {
    const semNome = await request(app).post('/api/agreements?tenant=hospital').send({ ...novoConvenio, name: ' ' })
    const tipo = await request(app).post('/api/agreements?tenant=hospital').send({ ...novoConvenio, benefitType: 'cashback' })
    const ativo = await request(app).post('/api/agreements?tenant=hospital').send({ ...novoConvenio, active: 'sim' })
    expect(semNome.body.erro).toBe('Informe o campo Nome.')
    expect(tipo.body.erro).toBe('Tipo de benefício inválido. Use: Isenção, Percentual, Horas grátis.')
    expect(ativo.body.erro).toBe('Informe se o convênio está ativo.')
  })

  it('rejeita percentual fora de 1 a 100', async () => {
    const respostas = await Promise.all([0, 101, 'metade'].map((benefitValue) => request(app).post('/api/agreements?tenant=hospital').send({ ...novoConvenio, benefitValue })))
    respostas.forEach((resposta) => expect(resposta.body.erro).toBe('O percentual de desconto deve estar entre 1 e 100.'))
  })

  it('rejeita horas grátis que não sejam inteiro positivo', async () => {
    const respostas = await Promise.all([0, 1.5, -2].map((benefitValue) => request(app).post('/api/agreements?tenant=hospital').send({ ...novoConvenio, benefitType: 'horasGratis', benefitValue })))
    respostas.forEach((resposta) => expect(resposta.body.erro).toBe('Informe a quantidade de horas grátis (número inteiro maior que zero).'))
  })

  it('não aceita dois convênios com o mesmo nome no tenant', async () => {
    const resposta = await request(app).post('/api/agreements?tenant=hospital').send({ ...novoConvenio, name: 'VidaCare' })
    expect(resposta.status).toBe(409)
  })
})

describe('API de convênios — validação de atendimento (classes Atendimento + Convenio)', () => {
  it('atendimento elegível devolve o benefício de descricaoBeneficio()', async () => {
    const resposta = await validar('atd-48291')
    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ number: 'ATD-48291', patient: 'Helena Moreira', agreement: 'Saúde Plena', benefit: 'Isenção de 100%', eligible: true, reason: '' })
  })

  it('a rota usa Atendimento.validarElegibilidade() e Convenio.descricaoBeneficio()', async () => {
    const elegibilidade = vi.spyOn(Atendimento.prototype, 'validarElegibilidade')
    const descricao = vi.spyOn(Convenio.prototype, 'descricaoBeneficio')
    await validar('ATD-71305')
    expect(elegibilidade).toHaveBeenCalled()
    expect(descricao).toHaveBeenCalled()
  })

  it('validar NÃO consome o benefício (isso fica para Pagamentos)', async () => {
    await validar('ATD-48291')
    const segunda = await validar('ATD-48291')
    expect(segunda.body.eligible).toBe(true)
    expect(db.prepare("SELECT beneficio_aplicado FROM atendimentos WHERE numero = 'ATD-48291'").get()).toEqual({ beneficio_aplicado: 0 })
  })

  it('atendimento inexistente → 404', async () => {
    const resposta = await validar('ATD-00000')
    expect(resposta.status).toBe(404)
    expect(resposta.body.erro).toBe('Atendimento não localizado.')
  })

  it('convênio inativo torna o atendimento inelegível', async () => {
    const resposta = await validar('ATD-55120')
    expect(resposta.body).toMatchObject({ eligible: false, reason: 'O convênio Plano Antigo está inativo.' })
  })

  it('desativar o convênio pelo CRUD faz o atendimento deixar de ser elegível', async () => {
    expect((await validar('ATD-10928')).body.eligible).toBe(true)
    const id = convenioPorNome('Bem Estar')!.id
    await request(app).put(`/api/agreements/${id}?tenant=hospital`).send({ name: 'Bem Estar', benefitType: 'horasGratis', benefitValue: 2, active: false })
    expect((await validar('ATD-10928')).body).toMatchObject({ eligible: false, reason: 'O convênio Bem Estar está inativo.' })
  })

  it('atendimento com mais de 24h ou com benefício já usado é inelegível', async () => {
    expect((await validar('ATD-30017')).body).toMatchObject({ eligible: false, reason: 'O atendimento tem mais de 24 horas.' })
    expect((await validar('ATD-90442')).body).toMatchObject({ eligible: false, reason: 'O benefício deste atendimento já foi utilizado.' })
  })

  it('exige o número do atendimento', async () => {
    expect((await validar('')).body.erro).toBe('Informe o número do atendimento.')
  })
})

describe('API de convênios — tenant e feature medicalAgreement', () => {
  it('exige um tenant válido', async () => {
    expect((await request(app).get('/api/agreements')).status).toBe(400)
    expect((await request(app).get('/api/agreements?tenant=aeroporto')).status).toBe(400)
  })

  it('Shopping, Condomínio e Empresa recebem 403 em todas as operações', async () => {
    for (const tenant of ['shopping', 'condominium', 'company']) {
      expect((await request(app).get(`/api/agreements?tenant=${tenant}`)).status).toBe(403)
      expect((await request(app).post(`/api/agreements?tenant=${tenant}`).send(novoConvenio)).status).toBe(403)
      expect((await validar('ATD-48291', tenant)).status).toBe(403)
    }
    const resposta = await request(app).get('/api/agreements?tenant=shopping')
    expect(resposta.body.erro).toBe('O módulo Convênio médico não está disponível para Shopping Center Aurora.')
  })

  describe('isolamento (simulando um segundo tenant com medicalAgreement ligado)', () => {
    beforeEach(() => { TENANTS.company.features.medicalAgreement = true })
    afterEach(() => { TENANTS.company.features.medicalAgreement = false })

    it('não lista, altera nem exclui convênio de outro tenant', async () => {
      const id = convenioPorNome('MedSul')!.id // pertence ao Hospital
      const lista = await request(app).get('/api/agreements?tenant=company')
      const alteracao = await request(app).put(`/api/agreements/${id}?tenant=company`).send(novoConvenio)
      const exclusao = await request(app).delete(`/api/agreements/${id}?tenant=company`)
      expect(lista.body).toEqual([])
      expect([alteracao.status, exclusao.status]).toEqual([404, 404])
      expect(convenioPorNome('MedSul')).toMatchObject({ tenant_id: 'hospital', ativo: 1 })
    })

    it('não valida atendimento de outro tenant', async () => {
      expect((await validar('ATD-48291', 'company')).status).toBe(404)
    })
  })
})

describe('seed e reset', () => {
  it('só tenants com medicalAgreement recebem convênios e atendimentos', () => {
    expect(db.prepare('SELECT DISTINCT tenant_id FROM convenios').all()).toEqual([{ tenant_id: 'hospital' }])
    expect(db.prepare('SELECT DISTINCT tenant_id FROM atendimentos').all()).toEqual([{ tenant_id: 'hospital' }])
  })

  it('as datas dos atendimentos são relativas ao momento do seed', () => {
    const { data_atendimento } = db.prepare("SELECT data_atendimento FROM atendimentos WHERE numero = 'ATD-48291'").get() as { data_atendimento: string }
    const horas = (Date.now() - new Date(data_atendimento).getTime()) / 3_600_000
    expect(horas).toBeGreaterThan(1.9)
    expect(horas).toBeLessThan(2.1)
  })

  it('/api/reset restaura convênios e atendimentos', async () => {
    await request(app).delete(`/api/agreements/${convenioPorNome('MedSul')!.id}?tenant=hospital`)
    await request(app).put(`/api/agreements/${convenioPorNome('VidaCare')!.id}?tenant=hospital`).send({ name: 'VidaCare', benefitType: 'percentual', benefitValue: 50, active: false })
    await request(app).post('/api/reset')
    expect(convenioPorNome('MedSul')).toBeDefined()
    expect(convenioPorNome('VidaCare')).toMatchObject({ ativo: 1 })
    expect(db.prepare('SELECT COUNT(*) AS total FROM atendimentos').get()).toEqual({ total: 6 })
  })
})
