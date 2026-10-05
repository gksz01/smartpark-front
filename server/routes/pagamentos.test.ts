// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Atendimento } from '../../src/domain/Atendimento'
import { Pagamento } from '../../src/domain/Pagamento'
import { PagamentoCredito } from '../../src/domain/strategies/pagamento/PagamentoCredito'
import { PagamentoDebito } from '../../src/domain/strategies/pagamento/PagamentoDebito'
import { PagamentoPix } from '../../src/domain/strategies/pagamento/PagamentoPix'
import { TarifaComConvenio } from '../../src/domain/strategies/tarifa/TarifaComConvenio'
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

function idDoVeiculo(placa: string, tenant: string): string {
  return String((db.prepare('SELECT id FROM veiculos WHERE placa = ? AND tenant_id = ?').get(placa, tenant) as { id: number }).id)
}
const shopping = () => idDoVeiculo('SPK1A23', 'shopping')
const hospital = () => idDoVeiculo('HSP2C34', 'hospital')

function pagar(tenant: string, corpo: Record<string, unknown>) {
  return request(app).post(`/api/payments?tenant=${tenant}`).send(corpo)
}
function pagamentoPorId(id: string | number) {
  return db.prepare('SELECT * FROM pagamentos WHERE id = ?').get(id) as Record<string, unknown> | undefined
}
function beneficioAplicado(numero: string): number {
  return (db.prepare('SELECT beneficio_aplicado FROM atendimentos WHERE numero = ?').get(numero) as { beneficio_aplicado: number }).beneficio_aplicado
}
function totalPagamentos(): number {
  return (db.prepare('SELECT COUNT(*) AS total FROM pagamentos').get() as { total: number }).total
}
function idDoPagamento(forma: string, status: string, tenant = 'shopping'): number {
  return (db.prepare('SELECT id FROM pagamentos WHERE forma = ? AND status = ? AND tenant_id = ?').get(forma, status, tenant) as { id: number }).id
}

describe('API de pagamentos — CRUD no SQLite', () => {
  it('READ: histórico do tenant, mais recentes primeiro', async () => {
    const resposta = await request(app).get('/api/payments?tenant=shopping')
    expect(resposta.status).toBe(200)
    expect(resposta.body.map((pagamento: { method: string; status: string }) => `${pagamento.method}:${pagamento.status}`)).toEqual(['Crédito:aprovado', 'Pix:aprovado', 'Débito:estornado'])
    expect(resposta.body[0]).toMatchObject({ vehicleLabel: 'Família · BRA2E19', duration: 4, amount: 48, chargedAmount: 50.4, installments: 3 })
  })

  it('CREATE: grava o pagamento processado, com o comprovante da Strategy', async () => {
    const resposta = await pagar('shopping', { vehicleId: shopping(), duration: 3, method: 'Pix' })
    expect(resposta.status).toBe(201)
    expect(resposta.body).toMatchObject({ tariffAmount: 36, amount: 36, chargedAmount: 36, method: 'Pix', status: 'aprovado', detail: 'Pix aprovado instantaneamente' })
    expect(resposta.body.receipt).toMatch(/^PIX-[0-9A-F]{6}$/)
    expect(pagamentoPorId(resposta.body.id)).toMatchObject({ tenant_id: 'shopping', valor: 36, valor_cobrado: 36, forma: 'Pix', status: 'aprovado', comprovante: resposta.body.receipt, atendimento_id: null })
  })

  it('o valor enviado pelo navegador é ignorado: a API recalcula', async () => {
    const resposta = await pagar('shopping', { vehicleId: shopping(), duration: 3, method: 'Pix', amount: 1, chargedAmount: 1 })
    expect(resposta.body.amount).toBe(36)
  })

  it('UPDATE (estorno): passa pelo domínio e não estorna duas vezes', async () => {
    const estornar = vi.spyOn(Pagamento.prototype, 'estornar')
    const id = idDoPagamento('Pix', 'aprovado')
    const resposta = await request(app).put(`/api/payments/${id}/refund?tenant=shopping`)
    expect(resposta.status).toBe(200)
    expect(estornar).toHaveBeenCalledTimes(1)
    expect(pagamentoPorId(id)).toMatchObject({ status: 'estornado' })

    const denovo = await request(app).put(`/api/payments/${id}/refund?tenant=shopping`)
    expect(denovo.status).toBe(409)
    expect(denovo.body.erro).toBe('Apenas pagamentos aprovados podem ser estornados.')
  })

  it('DELETE: aprovado é recusado; estornado é excluído', async () => {
    const aprovado = await request(app).delete(`/api/payments/${idDoPagamento('Pix', 'aprovado')}?tenant=shopping`)
    expect(aprovado.status).toBe(409)
    expect(aprovado.body.erro).toBe('Somente pagamentos estornados podem ser excluídos. Estorne o pagamento antes.')

    const id = idDoPagamento('Débito', 'estornado')
    expect((await request(app).delete(`/api/payments/${id}?tenant=shopping`)).status).toBe(204)
    expect(pagamentoPorId(id)).toBeUndefined()
  })

  it('fechar e reabrir o SQLite mantém o pagamento e o mesmo comprovante', async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'smartpark-'))
    const arquivo = join(pasta, 'teste.db')
    try {
      const bancoArquivo = abrirBanco(arquivo)
      popularBanco(bancoArquivo)
      const criado = await request(criarApp(bancoArquivo)).post('/api/payments?tenant=shopping').send({ vehicleId: '1', duration: 1, method: 'Débito' })
      bancoArquivo.close()

      const reaberto = abrirBanco(arquivo)
      const lista = await request(criarApp(reaberto)).get('/api/payments?tenant=shopping')
      reaberto.close()
      expect(lista.body.find((pagamento: { id: string }) => pagamento.id === criado.body.id)).toMatchObject({ receipt: criado.body.receipt, chargedAmount: 12 })
    } finally {
      rmSync(pasta, { recursive: true, force: true })
    }
  })
})

describe('API de pagamentos — Strategy de pagamento', () => {
  it('Pix: sem taxa e comprovante PIX', async () => {
    const pix = vi.spyOn(PagamentoPix.prototype, 'processar')
    const resposta = await pagar('shopping', { vehicleId: shopping(), duration: 2, method: 'Pix' })
    expect(pix).toHaveBeenCalledWith(24)
    expect(resposta.body).toMatchObject({ amount: 24, chargedAmount: 24 })
    expect(resposta.body.receipt).toMatch(/^PIX-/)
  })

  it('Crédito em 3x: 5% de taxa persistida e comprovante CRE', async () => {
    const credito = vi.spyOn(PagamentoCredito.prototype, 'processar')
    const resposta = await pagar('shopping', { vehicleId: shopping(), duration: 4, method: 'Crédito', installments: 3 })
    expect(credito).toHaveBeenCalledWith(48)
    expect(resposta.body).toMatchObject({ amount: 48, chargedAmount: 50.4, installments: 3, detail: 'Crédito em 3x de R$ 16,80' })
    expect(resposta.body.receipt).toMatch(/^CRE-/)
    expect(pagamentoPorId(resposta.body.id)).toMatchObject({ valor: 48, valor_cobrado: 50.4, parcelas: 3 })
  })

  it('Crédito à vista: sem taxa', async () => {
    const resposta = await pagar('shopping', { vehicleId: shopping(), duration: 4, method: 'Crédito', installments: 1 })
    expect(resposta.body).toMatchObject({ amount: 48, chargedAmount: 48, detail: 'Crédito à vista' })
  })

  it('Débito: sem taxa e comprovante DEB', async () => {
    const debito = vi.spyOn(PagamentoDebito.prototype, 'processar')
    const resposta = await pagar('shopping', { vehicleId: shopping(), duration: 1, method: 'Débito' })
    expect(debito).toHaveBeenCalled()
    expect(resposta.body).toMatchObject({ amount: 12, chargedAmount: 12 })
    expect(resposta.body.receipt).toMatch(/^DEB-/)
  })

  it('o limite de parcelas vem do PagamentoCredito', async () => {
    const quatro = await pagar('shopping', { vehicleId: shopping(), duration: 1, method: 'Crédito', installments: 4 })
    const quebrada = await pagar('shopping', { vehicleId: shopping(), duration: 1, method: 'Crédito', installments: 1.5 })
    expect(quatro.status).toBe(400)
    expect(quatro.body.erro).toBe('O crédito aceita de 1 a 3 parcelas.')
    expect(quebrada.body.erro).toBe('Informe o número de parcelas.')
  })

  it('valida forma, duração e tarifa ativa', async () => {
    const forma = await pagar('shopping', { vehicleId: shopping(), duration: 1, method: 'Boleto' })
    const duracao = await pagar('shopping', { vehicleId: shopping(), duration: 0, method: 'Pix' })
    db.prepare("UPDATE tarifas SET ativa = 0 WHERE tenant_id = 'shopping'").run()
    const semTarifa = await pagar('shopping', { vehicleId: shopping(), duration: 1, method: 'Pix' })
    expect(forma.body.erro).toBe('Forma de pagamento inválida. Use: Pix, Crédito, Débito.')
    expect(duracao.body.erro).toBe('A duração deve ser um número inteiro de 1 a 24 horas.')
    expect(semTarifa.status).toBe(409)
    expect(semTarifa.body.erro).toBe('Não há tarifa ativa neste cliente. Ative uma tarifa antes de cobrar.')
  })
})

describe('API de pagamentos — Tarifa + TarifaComConvenio (Hospital)', () => {
  it('sem atendimento: tarifa normal', async () => {
    const resposta = await pagar('hospital', { vehicleId: hospital(), duration: 3, method: 'Pix' })
    expect(resposta.body).toMatchObject({ tariffAmount: 30, amount: 30, attendanceNumber: null })
  })

  it('isenção: valor 0 pela TarifaComConvenio, benefício consumido', async () => {
    const comConvenio = vi.spyOn(TarifaComConvenio.prototype, 'calcular')
    const resposta = await pagar('hospital', { vehicleId: hospital(), duration: 3, method: 'Pix', attendanceNumber: 'atd-48291' })
    expect(resposta.status).toBe(201)
    expect(comConvenio).toHaveBeenCalledWith(3)
    expect(resposta.body).toMatchObject({ tariffAmount: 30, amount: 0, chargedAmount: 0, attendanceNumber: 'ATD-48291', agreementName: 'Saúde Plena', status: 'aprovado' })
    expect(beneficioAplicado('ATD-48291')).toBe(1)
  })

  it('percentual: 50% de desconto', async () => {
    const resposta = await pagar('hospital', { vehicleId: hospital(), duration: 3, method: 'Débito', attendanceNumber: 'ATD-71305' })
    expect(resposta.body).toMatchObject({ tariffAmount: 30, amount: 15, chargedAmount: 15 })
  })

  it('horas grátis: as 2 primeiras horas não são cobradas', async () => {
    const resposta = await pagar('hospital', { vehicleId: hospital(), duration: 3, method: 'Pix', attendanceNumber: 'ATD-10928' })
    expect(resposta.body).toMatchObject({ tariffAmount: 30, amount: 10 })
  })

  it('convênio + crédito parcelado: a taxa incide sobre o valor com desconto', async () => {
    const resposta = await pagar('hospital', { vehicleId: hospital(), duration: 3, method: 'Crédito', installments: 2, attendanceNumber: 'ATD-71305' })
    expect(resposta.body).toMatchObject({ amount: 15, chargedAmount: 15.75 })
  })
})

describe('API de pagamentos — Atendimento e benefício', () => {
  it('a segunda tentativa com o mesmo atendimento é recusada pela classe Atendimento', async () => {
    await pagar('hospital', { vehicleId: hospital(), duration: 1, method: 'Pix', attendanceNumber: 'ATD-48291' })
    const elegibilidade = vi.spyOn(Atendimento.prototype, 'validarElegibilidade')
    const segunda = await pagar('hospital', { vehicleId: hospital(), duration: 1, method: 'Pix', attendanceNumber: 'ATD-48291' })
    expect(segunda.status).toBe(409)
    expect(segunda.body.erro).toBe('O benefício deste atendimento já foi utilizado.')
    expect(elegibilidade).toHaveReturnedWith(false)
  })

  it('recusa atendimento inexistente, antigo, de convênio inativo ou já usado', async () => {
    const corpo = { vehicleId: hospital(), duration: 1, method: 'Pix' }
    const inexistente = await pagar('hospital', { ...corpo, attendanceNumber: 'ATD-00000' })
    const antigo = await pagar('hospital', { ...corpo, attendanceNumber: 'ATD-30017' })
    const inativo = await pagar('hospital', { ...corpo, attendanceNumber: 'ATD-55120' })
    const usado = await pagar('hospital', { ...corpo, attendanceNumber: 'ATD-90442' })
    expect(inexistente.status).toBe(404)
    expect(antigo.body.erro).toBe('O atendimento tem mais de 24 horas.')
    expect(inativo.body.erro).toBe('O convênio Plano Antigo está inativo.')
    expect(usado.body.erro).toBe('O benefício deste atendimento já foi utilizado.')
  })

  it('falha no processamento do pagamento não consome o benefício', async () => {
    vi.spyOn(Pagamento.prototype, 'processar').mockImplementation(() => { throw new Error('Falha simulada no processamento.') })
    const antes = totalPagamentos()
    const resposta = await pagar('hospital', { vehicleId: hospital(), duration: 1, method: 'Pix', attendanceNumber: 'ATD-48291' })
    expect(resposta.status).toBe(409)
    expect(beneficioAplicado('ATD-48291')).toBe(0)
    expect(totalPagamentos()).toBe(antes)
  })

  it('falha ao consumir o benefício não grava o pagamento (transação)', async () => {
    vi.spyOn(Atendimento.prototype, 'aplicarBeneficio').mockImplementation(() => { throw new Error('Falha simulada ao aplicar o benefício.') })
    const antes = totalPagamentos()
    const resposta = await pagar('hospital', { vehicleId: hospital(), duration: 1, method: 'Pix', attendanceNumber: 'ATD-48291' })
    expect(resposta.status).toBe(409)
    expect(totalPagamentos()).toBe(antes)
    expect(beneficioAplicado('ATD-48291')).toBe(0)
  })

  it('estornar não devolve o benefício', async () => {
    const pago = await pagar('hospital', { vehicleId: hospital(), duration: 1, method: 'Pix', attendanceNumber: 'ATD-48291' })
    await request(app).put(`/api/payments/${pago.body.id}/refund?tenant=hospital`)
    expect(pagamentoPorId(pago.body.id)).toMatchObject({ status: 'estornado' })
    expect(beneficioAplicado('ATD-48291')).toBe(1)
    const validacao = await request(app).post('/api/agreements/validate?tenant=hospital').send({ number: 'ATD-48291' })
    expect(validacao.body).toMatchObject({ eligible: false, reason: 'O benefício deste atendimento já foi utilizado.' })
  })

  it('o Shopping (sem medicalAgreement) não aceita atendimento', async () => {
    const resposta = await pagar('shopping', { vehicleId: shopping(), duration: 1, method: 'Pix', attendanceNumber: 'ATD-48291' })
    expect(resposta.status).toBe(400)
    expect(resposta.body.erro).toBe('Convênio médico não está disponível para Shopping Center Aurora.')
    expect(beneficioAplicado('ATD-48291')).toBe(0)
  })
})

describe('API de pagamentos — tenant, billing e integridade', () => {
  it('exige tenant válido; Condomínio e Empresa recebem 403', async () => {
    expect((await request(app).get('/api/payments')).status).toBe(400)
    for (const tenant of ['condominium', 'company']) {
      expect((await request(app).get(`/api/payments?tenant=${tenant}`)).status).toBe(403)
      expect((await pagar(tenant, { vehicleId: '1', duration: 1, method: 'Pix' })).status).toBe(403)
    }
    expect((await request(app).get('/api/payments?tenant=company')).body.erro).toBe('O módulo Cobrança individual não está disponível para Nexora Tecnologia.')
  })

  it('não aceita veículo nem reserva de outro tenant', async () => {
    const veiculo = await pagar('hospital', { vehicleId: shopping(), duration: 1, method: 'Pix' })
    const reservaShopping = (db.prepare("SELECT id FROM reservas WHERE tenant_id = 'shopping'").get() as { id: number }).id
    const reserva = await pagar('hospital', { vehicleId: hospital(), duration: 1, method: 'Pix', reservationId: reservaShopping })
    expect(veiculo.body.erro).toBe('Veículo não encontrado neste cliente.')
    expect(reserva.body.erro).toBe('Reserva não encontrada neste cliente.')
  })

  it('a reserva precisa ser do mesmo veículo', async () => {
    const reserva = (db.prepare("SELECT id FROM reservas WHERE tenant_id = 'shopping'").get() as { id: number }).id // do BRA2E19
    const resposta = await pagar('shopping', { vehicleId: shopping(), duration: 1, method: 'Pix', reservationId: reserva })
    expect(resposta.body.erro).toBe('A reserva informada é de outro veículo.')
  })

  it('não lista, estorna nem exclui pagamento de outro tenant', async () => {
    const id = idDoPagamento('Pix', 'aprovado', 'hospital')
    const lista = await request(app).get('/api/payments?tenant=shopping')
    const estorno = await request(app).put(`/api/payments/${id}/refund?tenant=shopping`)
    const exclusao = await request(app).delete(`/api/payments/${idDoPagamento('Débito', 'estornado')}?tenant=hospital`)
    expect(lista.body.some((pagamento: { id: string }) => pagamento.id === String(id))).toBe(false)
    expect([estorno.status, exclusao.status]).toEqual([404, 404])
  })

  it('foreign keys viram 409 com mensagem de negócio', async () => {
    const veiculoComPagamento = await request(app).delete(`/api/vehicles/${hospital()}?tenant=hospital`)
    const reservaCancelada = (db.prepare("SELECT id FROM reservas WHERE status = 'cancelada'").get() as { id: number }).id // tem pagamento estornado
    const reserva = await request(app).delete(`/api/reservations/${reservaCancelada}?tenant=shopping`)
    expect(veiculoComPagamento.status).toBe(409)
    expect(veiculoComPagamento.body.erro).toBe('Este veículo possui pagamentos registrados. Exclua os pagamentos dele antes.')
    expect(reserva.status).toBe(409)
    expect(reserva.body.erro).toBe('Esta reserva possui pagamento registrado. Exclua o pagamento antes.')
  })

  it('o banco recusa dois pagamentos para o mesmo atendimento', () => {
    const atendimento = (db.prepare("SELECT atendimento_id FROM pagamentos WHERE atendimento_id IS NOT NULL").get() as { atendimento_id: number }).atendimento_id
    expect(() => db.prepare(`
      INSERT INTO pagamentos (tenant_id, veiculo_id, atendimento_id, duracao_horas, valor_tarifa, valor, valor_cobrado, forma, status, comprovante, criado_em)
      VALUES ('hospital', 5, ?, 1, 10, 0, 0, 'Pix', 'aprovado', 'PIX-TESTE', '2026-10-05T10:00:00Z')
    `).run(atendimento)).toThrow(/UNIQUE/)
  })
})

describe('API de pagamentos — seed e reset', () => {
  it('pagamentos com atendimento estão ligados a atendimentos com benefício aplicado', () => {
    const incoerentes = db.prepare('SELECT COUNT(*) AS total FROM pagamentos p JOIN atendimentos a ON a.id = p.atendimento_id WHERE a.beneficio_aplicado = 0').get()
    expect(incoerentes).toEqual({ total: 0 })
    expect(db.prepare("SELECT DISTINCT tenant_id FROM pagamentos ORDER BY tenant_id").all()).toEqual([{ tenant_id: 'hospital' }, { tenant_id: 'shopping' }])
  })

  it('/api/reset restaura pagamentos e benefícios', async () => {
    await pagar('hospital', { vehicleId: hospital(), duration: 1, method: 'Pix', attendanceNumber: 'ATD-48291' })
    await request(app).post('/api/reset')
    expect(totalPagamentos()).toBe(5)
    expect(beneficioAplicado('ATD-48291')).toBe(0)
    expect(beneficioAplicado('ATD-90442')).toBe(1)
  })
})
