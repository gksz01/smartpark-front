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

const novoAcesso = { person: 'Ana Prado', identifier: 'abc1d23', method: 'LPR', direction: 'Entrada', status: 'Liberado', denialReason: '' }

function linhaPorId(id: number) {
  return db.prepare('SELECT * FROM acessos WHERE id = ?').get(id) as Record<string, unknown> | undefined
}

function idDe(pessoa: string, tenant: string): number {
  const linha = db.prepare('SELECT id FROM acessos WHERE pessoa = ? AND tenant_id = ?').get(pessoa, tenant) as { id: number }
  return linha.id
}

describe('API de acessos — CRUD no SQLite', () => {
  it('READ: lista os acessos do tenant, mais recentes primeiro', async () => {
    const resposta = await request(app).get('/api/access?tenant=shopping')
    expect(resposta.status).toBe(200)
    expect(resposta.body.map((acesso: { person: string }) => acesso.person)).toEqual(['Marina Costa', 'Rafael Lima', 'Bruno Dias', 'Carlos Nunes', 'Paula Mendes'])
    expect(resposta.body[3]).toMatchObject({ identifier: 'SPK1A23', method: 'LPR', status: 'Negado', denialReason: 'Placa sem cadastro', manual: false, time: '13:41' })
    expect(resposta.body[4].manual).toBe(true)
  })

  it('CREATE: grava uma liberação manual com o método do tenant e horário atual', async () => {
    const resposta = await request(app).post('/api/access?tenant=shopping').send(novoAcesso)
    expect(resposta.status).toBe(201)
    expect(resposta.body).toMatchObject({ person: 'Ana Prado', identifier: 'ABC1D23', method: 'LPR', status: 'Liberado', manual: true })

    const linha = linhaPorId(Number(resposta.body.id))
    expect(linha).toMatchObject({ tenant_id: 'shopping', metodo: 'LPR', direcao: 'Entrada', status: 'Liberado', manual: 1, motivo_negacao: null })
    expect(Date.now() - new Date(linha!.horario as string).getTime()).toBeLessThan(60_000)
  })

  it('UPDATE: altera pessoa, identificador e direção no banco', async () => {
    const id = idDe('Marina Costa', 'shopping')
    const resposta = await request(app).put(`/api/access/${id}?tenant=shopping`).send({ ...novoAcesso, person: 'Marina C. Costa', identifier: 'bra2e19', direction: 'Saída' })
    expect(resposta.status).toBe(200)
    expect(linhaPorId(id)).toMatchObject({ pessoa: 'Marina C. Costa', identificador: 'BRA2E19', direcao: 'Saída', status: 'Liberado', manual: 0 })
  })

  it('DELETE: remove o registro do banco', async () => {
    const id = idDe('Marina Costa', 'shopping')
    const resposta = await request(app).delete(`/api/access/${id}?tenant=shopping`)
    expect(resposta.status).toBe(204)
    expect(linhaPorId(id)).toBeUndefined()
  })

  it('os dados continuam no arquivo SQLite depois de fechar e reabrir o banco', async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'smartpark-'))
    const arquivo = join(pasta, 'teste.db')
    try {
      const bancoArquivo = abrirBanco(arquivo)
      await request(criarApp(bancoArquivo)).post('/api/access?tenant=company').send({ ...novoAcesso, identifier: 'rf-12345', method: 'RFID' })
      bancoArquivo.close()

      const reaberto = abrirBanco(arquivo)
      const resposta = await request(criarApp(reaberto)).get('/api/access?tenant=company')
      reaberto.close()
      expect(resposta.body).toEqual([expect.objectContaining({ person: 'Ana Prado', identifier: 'RF-12345', method: 'RFID', manual: true })])
    } finally {
      rmSync(pasta, { recursive: true, force: true })
    }
  })
})

describe('API de acessos — decisões com a classe Acesso', () => {
  it('libera um acesso Pendente (acesso.liberar())', async () => {
    const id = idDe('Bruno Dias', 'shopping')
    const resposta = await request(app).put(`/api/access/${id}?tenant=shopping`).send({ ...novoAcesso, person: 'Bruno Dias', identifier: 'DFK4J86', status: 'Liberado' })
    expect(resposta.status).toBe(200)
    expect(linhaPorId(id)).toMatchObject({ status: 'Liberado', motivo_negacao: null })
  })

  it('nega um acesso Pendente com motivo (acesso.negar(motivo))', async () => {
    const id = idDe('Bruno Dias', 'shopping')
    const resposta = await request(app).put(`/api/access/${id}?tenant=shopping`).send({ ...novoAcesso, person: 'Bruno Dias', identifier: 'DFK4J86', status: 'Negado', denialReason: ' Veículo não autorizado ' })
    expect(resposta.status).toBe(200)
    expect(resposta.body.denialReason).toBe('Veículo não autorizado')
    expect(linhaPorId(id)).toMatchObject({ status: 'Negado', motivo_negacao: 'Veículo não autorizado' })
  })

  it('exige motivo para negar (no Update e no Create)', async () => {
    const id = idDe('Bruno Dias', 'shopping')
    const update = await request(app).put(`/api/access/${id}?tenant=shopping`).send({ ...novoAcesso, status: 'Negado', denialReason: '' })
    const create = await request(app).post('/api/access?tenant=shopping').send({ ...novoAcesso, status: 'Negado' })
    expect(update.body.erro).toBe('Informe o motivo da negação.')
    expect(create.body.erro).toBe('Informe o motivo da negação.')
    expect(linhaPorId(id)).toMatchObject({ status: 'Pendente' })
  })

  it('não muda o status de um acesso já decidido', async () => {
    const liberado = idDe('Marina Costa', 'shopping')
    const negado = idDe('Carlos Nunes', 'shopping')
    const paraNegado = await request(app).put(`/api/access/${liberado}?tenant=shopping`).send({ ...novoAcesso, status: 'Negado', denialReason: 'Teste' })
    const paraPendente = await request(app).put(`/api/access/${negado}?tenant=shopping`).send({ ...novoAcesso, status: 'Pendente' })
    expect(paraNegado.status).toBe(400)
    expect(paraNegado.body.erro).toBe('Este acesso já foi liberado.')
    expect(paraPendente.body.erro).toBe('Este acesso já foi negado e não pode voltar para Pendente.')
    expect(linhaPorId(liberado)).toMatchObject({ status: 'Liberado' })
  })

  it('permite corrigir o motivo de um acesso negado', async () => {
    const id = idDe('Carlos Nunes', 'shopping')
    await request(app).put(`/api/access/${id}?tenant=shopping`).send({ ...novoAcesso, person: 'Carlos Nunes', identifier: 'SPK1A23', status: 'Negado', denialReason: 'Placa clonada' })
    expect(linhaPorId(id)).toMatchObject({ status: 'Negado', motivo_negacao: 'Placa clonada' })
  })
})

describe('API de acessos — multi-tenant e accessMethod', () => {
  it('cada tenant recebe apenas os seus acessos, com o seu método', async () => {
    const condominio = await request(app).get('/api/access?tenant=condominium')
    const empresa = await request(app).get('/api/access?tenant=company')
    expect(new Set(condominio.body.map((acesso: { method: string }) => acesso.method))).toEqual(new Set(['QR_CODE']))
    expect(new Set(empresa.body.map((acesso: { method: string }) => acesso.method))).toEqual(new Set(['RFID']))
    expect(condominio.body.some((acesso: { person: string }) => acesso.person === 'Marina Costa')).toBe(false)
  })

  it('não altera nem exclui acesso de outro tenant', async () => {
    const id = idDe('Marina Costa', 'shopping')
    const alteracao = await request(app).put(`/api/access/${id}?tenant=hospital`).send(novoAcesso)
    const exclusao = await request(app).delete(`/api/access/${id}?tenant=hospital`)
    expect(alteracao.status).toBe(404)
    expect(exclusao.status).toBe(404)
    expect(linhaPorId(id)).toMatchObject({ pessoa: 'Marina Costa' })
  })

  it('exige um tenant válido', async () => {
    expect((await request(app).get('/api/access')).status).toBe(400)
    expect((await request(app).post('/api/access?tenant=aeroporto').send(novoAcesso)).status).toBe(400)
  })

  it('rejeita método incompatível com o accessMethod do tenant', async () => {
    // O Condomínio usa QR Code, não LPR
    const resposta = await request(app).post('/api/access?tenant=condominium').send(novoAcesso)
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro).toBe('Método de acesso incompatível com Residencial Horizonte. Use: QR Code.')
  })
})

describe('API de acessos — validações', () => {
  it('rejeita direção e status inválidos', async () => {
    const direcao = await request(app).post('/api/access?tenant=shopping').send({ ...novoAcesso, direction: 'Lateral' })
    const status = await request(app).post('/api/access?tenant=shopping').send({ ...novoAcesso, status: 'Aprovado' })
    expect(direcao.body.erro).toBe('Direção inválida. Use: Entrada, Saída.')
    expect(status.body.erro).toBe('Status inválido. Use: Liberado, Pendente, Negado.')
  })

  it('exige pessoa e identificador', async () => {
    const semPessoa = await request(app).post('/api/access?tenant=shopping').send({ ...novoAcesso, person: '' })
    const semIdentificador = await request(app).post('/api/access?tenant=shopping').send({ ...novoAcesso, identifier: '  ' })
    expect(semPessoa.body.erro).toBe('Informe o campo Pessoa.')
    expect(semIdentificador.body.erro).toBe('Informe o identificador do acesso.')
  })

  it('/api/reset restaura também os acessos', async () => {
    await request(app).delete(`/api/access/${idDe('Marina Costa', 'shopping')}?tenant=shopping`)
    await request(app).post('/api/reset')
    expect(linhaPorId(1)).toMatchObject({ pessoa: 'Marina Costa', tenant_id: 'shopping' })
  })
})
