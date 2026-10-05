import { VarianteCondominio } from '../../src/domain/factories/variante/VarianteCondominio'
import { VarianteEmpresa } from '../../src/domain/factories/variante/VarianteEmpresa'
import { VarianteHospital } from '../../src/domain/factories/variante/VarianteHospital'
import { VarianteShopping } from '../../src/domain/factories/variante/VarianteShopping'
import { configuracaoDaEstrategia } from '../../src/domain/strategies/tarifa/estrategiaPorTipo'
import type { Banco } from '../database/conexao'

/** Veículos de demonstração. A mesma placa pode existir em clientes diferentes. */
const VEICULOS_INICIAIS = [
  { tenant_id: 'shopping', apelido: 'Meu carro', placa: 'SPK1A23', modelo: 'Honda City', cor: 'Cinza', unidade: null, tag_rfid: null },
  { tenant_id: 'shopping', apelido: 'Família', placa: 'BRA2E19', modelo: 'Jeep Renegade', cor: 'Branco', unidade: null, tag_rfid: null },
  { tenant_id: 'condominium', apelido: 'Meu carro', placa: 'SPK1A23', modelo: 'Honda City', cor: 'Cinza', unidade: 'Torre B · 804', tag_rfid: null },
  { tenant_id: 'condominium', apelido: 'Segundo carro', placa: 'RES4B21', modelo: 'Fiat Pulse', cor: 'Vermelho', unidade: 'Torre B · 804', tag_rfid: null },
  { tenant_id: 'hospital', apelido: 'Meu carro', placa: 'HSP2C34', modelo: 'Toyota Corolla', cor: 'Preto', unidade: null, tag_rfid: null },
  { tenant_id: 'company', apelido: 'Meu carro', placa: 'SPK1A23', modelo: 'Honda City', cor: 'Cinza', unidade: null, tag_rfid: 'NX-92841' },
  { tenant_id: 'company', apelido: 'Carro da equipe', placa: 'NXR5D67', modelo: 'Chevrolet Onix', cor: 'Branco', unidade: null, tag_rfid: 'NX-71520' },
]

/** Pessoas de demonstração: os tipos mudam conforme o personTypes de cada tenant. */
const USUARIOS_INICIAIS = [
  { tenant_id: 'shopping', nome: 'Marina Costa', documento: '123.456.789-01', tipo: 'motorista', perfil: 'driver', ativo: 1 },
  { tenant_id: 'shopping', nome: 'Pedro Alves', documento: '234.567.890-12', tipo: 'motorista', perfil: 'driver', ativo: 0 },
  { tenant_id: 'shopping', nome: 'Rafael Lima', documento: '345.678.901-23', tipo: 'funcionario', perfil: 'valet', ativo: 1 },
  { tenant_id: 'condominium', nome: 'Juliana Reis', documento: '456.789.012-34', tipo: 'morador', perfil: 'resident', ativo: 1 },
  { tenant_id: 'condominium', nome: 'Carlos Nunes', documento: '567.890.123-45', tipo: 'visitante', perfil: 'visitor', ativo: 1 },
  { tenant_id: 'hospital', nome: 'Helena Moreira', documento: '678.901.234-56', tipo: 'paciente', perfil: 'driver', ativo: 1 },
  { tenant_id: 'hospital', nome: 'Beatriz Souza', documento: '789.012.345-67', tipo: 'acompanhante', perfil: 'visitor', ativo: 1 },
  { tenant_id: 'company', nome: 'Lucas Martins', documento: '890.123.456-78', tipo: 'funcionario', perfil: 'employee', ativo: 1 },
  { tenant_id: 'company', nome: 'Diego Ramos', documento: '901.234.567-89', tipo: 'visitante', perfil: 'visitor', ativo: 1 },
]

/** Vagas de demonstração: os tipos mudam conforme o spaceTypes de cada tenant. */
const VAGAS_INICIAIS = [
  { tenant_id: 'shopping', codigo: 'A-01', setor: 'A', tipo: 'Comum', status: 'Livre' },
  { tenant_id: 'shopping', codigo: 'A-02', setor: 'A', tipo: 'PCD', status: 'Ocupada' },
  { tenant_id: 'shopping', codigo: 'A-03', setor: 'A', tipo: 'Elétrico', status: 'Reservada' },
  { tenant_id: 'shopping', codigo: 'A-04', setor: 'A', tipo: 'Comum', status: 'Bloqueada' },
  { tenant_id: 'shopping', codigo: 'B-11', setor: 'B', tipo: 'Comum', status: 'Livre' },
  { tenant_id: 'shopping', codigo: 'B-12', setor: 'B', tipo: 'Comum', status: 'Ocupada' },
  { tenant_id: 'shopping', codigo: 'B-13', setor: 'B', tipo: 'Elétrico', status: 'Livre' },
  { tenant_id: 'shopping', codigo: 'B-14', setor: 'B', tipo: 'PCD', status: 'Livre' },
  { tenant_id: 'condominium', codigo: 'T1-101', setor: 'Torre 1', tipo: 'Nominal', status: 'Ocupada' },
  { tenant_id: 'condominium', codigo: 'T1-102', setor: 'Torre 1', tipo: 'Nominal', status: 'Livre' },
  { tenant_id: 'condominium', codigo: 'T2-804', setor: 'Torre 2', tipo: 'Nominal', status: 'Ocupada' },
  { tenant_id: 'condominium', codigo: 'V-01', setor: 'Visitantes', tipo: 'Comum', status: 'Livre' },
  { tenant_id: 'condominium', codigo: 'V-02', setor: 'Visitantes', tipo: 'PCD', status: 'Bloqueada' },
  { tenant_id: 'hospital', codigo: 'P-01', setor: 'Pronto-socorro', tipo: 'Prioritária', status: 'Ocupada' },
  { tenant_id: 'hospital', codigo: 'P-02', setor: 'Pronto-socorro', tipo: 'Prioritária', status: 'Livre' },
  { tenant_id: 'hospital', codigo: 'P-03', setor: 'Pronto-socorro', tipo: 'PCD', status: 'Livre' },
  { tenant_id: 'hospital', codigo: 'C-10', setor: 'Consultórios', tipo: 'Comum', status: 'Ocupada' },
  { tenant_id: 'hospital', codigo: 'C-11', setor: 'Consultórios', tipo: 'Comum', status: 'Bloqueada' },
  { tenant_id: 'company', codigo: 'D-01', setor: 'Diretoria', tipo: 'Restrito', status: 'Ocupada' },
  { tenant_id: 'company', codigo: 'D-02', setor: 'Diretoria', tipo: 'Restrito', status: 'Livre' },
  { tenant_id: 'company', codigo: 'G-01', setor: 'Garagem', tipo: 'Elétrico', status: 'Ocupada' },
  { tenant_id: 'company', codigo: 'G-02', setor: 'Garagem', tipo: 'Comum', status: 'Livre' },
  { tenant_id: 'company', codigo: 'G-03', setor: 'Garagem', tipo: 'PCD', status: 'Livre' },
]

/** Data de hoje no horário informado, em ISO (os acessos de demonstração são sempre "de hoje"). */
function hojeAs(hora: number, minuto: number): string {
  const data = new Date()
  data.setHours(hora, minuto, 0, 0)
  return data.toISOString()
}

/** Acessos de demonstração: o identificador segue o accessMethod de cada tenant. */
const ACESSOS_INICIAIS = [
  // Shopping: LPR (placa)
  { tenant_id: 'shopping', pessoa: 'Marina Costa', identificador: 'BRA2E19', metodo: 'LPR', direcao: 'Entrada', status: 'Liberado', manual: 0, motivo_negacao: null, horario: hojeAs(14, 32) },
  { tenant_id: 'shopping', pessoa: 'Rafael Lima', identificador: 'GHT7A42', metodo: 'LPR', direcao: 'Saída', status: 'Liberado', manual: 0, motivo_negacao: null, horario: hojeAs(14, 18) },
  { tenant_id: 'shopping', pessoa: 'Bruno Dias', identificador: 'DFK4J86', metodo: 'LPR', direcao: 'Entrada', status: 'Pendente', manual: 0, motivo_negacao: null, horario: hojeAs(13, 54) },
  { tenant_id: 'shopping', pessoa: 'Carlos Nunes', identificador: 'SPK1A23', metodo: 'LPR', direcao: 'Entrada', status: 'Negado', manual: 0, motivo_negacao: 'Placa sem cadastro', horario: hojeAs(13, 41) },
  { tenant_id: 'shopping', pessoa: 'Paula Mendes', identificador: 'FGH3J21', metodo: 'LPR', direcao: 'Entrada', status: 'Liberado', manual: 1, motivo_negacao: null, horario: hojeAs(12, 10) },
  // Condomínio: QR Code
  { tenant_id: 'condominium', pessoa: 'Juliana Reis', identificador: 'QR-4839-221', metodo: 'QR_CODE', direcao: 'Entrada', status: 'Liberado', manual: 0, motivo_negacao: null, horario: hojeAs(14, 5) },
  { tenant_id: 'condominium', pessoa: 'Carlos Nunes', identificador: 'QR-9912-118', metodo: 'QR_CODE', direcao: 'Entrada', status: 'Pendente', manual: 0, motivo_negacao: null, horario: hojeAs(13, 50) },
  { tenant_id: 'condominium', pessoa: 'Entrega Rápida', identificador: 'QR-1157-620', metodo: 'QR_CODE', direcao: 'Saída', status: 'Liberado', manual: 1, motivo_negacao: null, horario: hojeAs(12, 30) },
  { tenant_id: 'condominium', pessoa: 'Visitante não identificado', identificador: 'QR-0000-000', metodo: 'QR_CODE', direcao: 'Entrada', status: 'Negado', manual: 0, motivo_negacao: 'QR Code expirado', horario: hojeAs(11, 15) },
  // Hospital: LPR (placa)
  { tenant_id: 'hospital', pessoa: 'Helena Moreira', identificador: 'HSP2C34', metodo: 'LPR', direcao: 'Entrada', status: 'Liberado', manual: 0, motivo_negacao: null, horario: hojeAs(14, 40) },
  { tenant_id: 'hospital', pessoa: 'Beatriz Souza', identificador: 'QWE1A23', metodo: 'LPR', direcao: 'Entrada', status: 'Pendente', manual: 0, motivo_negacao: null, horario: hojeAs(14, 12) },
  { tenant_id: 'hospital', pessoa: 'Roberto Alves', identificador: 'RTY4B56', metodo: 'LPR', direcao: 'Saída', status: 'Liberado', manual: 1, motivo_negacao: null, horario: hojeAs(13, 2) },
  { tenant_id: 'hospital', pessoa: 'João Lima', identificador: 'JKL7M89', metodo: 'LPR', direcao: 'Entrada', status: 'Negado', manual: 0, motivo_negacao: 'Vagas de visitante lotadas', horario: hojeAs(12, 45) },
  // Empresa: RFID (tag)
  { tenant_id: 'company', pessoa: 'Lucas Martins', identificador: 'RF-10982', metodo: 'RFID', direcao: 'Entrada', status: 'Liberado', manual: 0, motivo_negacao: null, horario: hojeAs(8, 55) },
  { tenant_id: 'company', pessoa: 'Fernanda Rocha', identificador: 'RF-28473', metodo: 'RFID', direcao: 'Saída', status: 'Liberado', manual: 0, motivo_negacao: null, horario: hojeAs(12, 2) },
  { tenant_id: 'company', pessoa: 'Diego Ramos', identificador: 'RF-67011', metodo: 'RFID', direcao: 'Entrada', status: 'Pendente', manual: 0, motivo_negacao: null, horario: hojeAs(13, 20) },
  { tenant_id: 'company', pessoa: 'Ex-colaborador', identificador: 'RF-44310', metodo: 'RFID', direcao: 'Entrada', status: 'Negado', manual: 0, motivo_negacao: 'Tag desativada', horario: hojeAs(9, 10) },
  { tenant_id: 'company', pessoa: 'Técnico de manutenção', identificador: 'RF-VISITA-01', metodo: 'RFID', direcao: 'Entrada', status: 'Liberado', manual: 1, motivo_negacao: null, horario: hojeAs(10, 30) },
]

/** Tarifas alternativas (inativas) para demonstrar a troca de Strategy. A padrão vem da variante. */
const TARIFAS_ALTERNATIVAS = [
  { tenant_id: 'shopping', nome: 'Diária promocional', tipo_estrategia: 'DIARIA', valor: 40, valor_maximo_diario: null },
  { tenant_id: 'shopping', nome: 'Cortesia para lojistas', tipo_estrategia: 'ISENTA', valor: 0, valor_maximo_diario: null },
  { tenant_id: 'hospital', nome: 'Diária de acompanhante', tipo_estrategia: 'DIARIA', valor: 30, valor_maximo_diario: null },
]

export function popularVeiculos(db: Banco): void {
  const inserir = db.prepare(`
    INSERT INTO veiculos (tenant_id, apelido, placa, modelo, cor, unidade, tag_rfid)
    VALUES (@tenant_id, @apelido, @placa, @modelo, @cor, @unidade, @tag_rfid)
  `)
  for (const veiculo of VEICULOS_INICIAIS) inserir.run(veiculo)
}

export function popularUsuarios(db: Banco): void {
  const inserir = db.prepare(`
    INSERT INTO usuarios (tenant_id, nome, documento, tipo, perfil, ativo)
    VALUES (@tenant_id, @nome, @documento, @tipo, @perfil, @ativo)
  `)
  for (const usuario of USUARIOS_INICIAIS) inserir.run(usuario)
}

export function popularVagas(db: Banco): void {
  const inserir = db.prepare(`
    INSERT INTO vagas (tenant_id, codigo, setor, tipo, status)
    VALUES (@tenant_id, @codigo, @setor, @tipo, @status)
  `)
  for (const vaga of VAGAS_INICIAIS) inserir.run(vaga)
}

export function popularAcessos(db: Banco): void {
  const inserir = db.prepare(`
    INSERT INTO acessos (tenant_id, pessoa, identificador, metodo, direcao, status, manual, motivo_negacao, horario)
    VALUES (@tenant_id, @pessoa, @identificador, @metodo, @direcao, @status, @manual, @motivo_negacao, @horario)
  `)
  for (const acesso of ACESSOS_INICIAIS) inserir.run(acesso)
}

export function popularTarifas(db: Banco): void {
  const inserir = db.prepare(`
    INSERT INTO tarifas (tenant_id, nome, tipo_estrategia, valor, valor_maximo_diario, ativa)
    VALUES (@tenant_id, @nome, @tipo_estrategia, @valor, @valor_maximo_diario, @ativa)
  `)

  const variantes = [new VarianteShopping(), new VarianteHospital(), new VarianteCondominio(), new VarianteEmpresa()]
  for (const variante of variantes) {
    if (!variante.possuiFeature('billing')) continue // só clientes com cobrança têm tarifas
    // FACTORY METHOD: a variante decide qual Strategy é a tarifa padrão (ativa)
    const tarifa = variante.criarTarifa('padrao')
    const configuracao = configuracaoDaEstrategia(tarifa.estrategia)
    inserir.run({
      tenant_id: variante.tenantId,
      nome: tarifa.nome,
      tipo_estrategia: configuracao.tipo,
      valor: configuracao.valor,
      valor_maximo_diario: configuracao.valorMaximoDiario,
      ativa: 1,
    })
  }
  for (const tarifa of TARIFAS_ALTERNATIVAS) inserir.run({ ...tarifa, ativa: 0 })
}

export function popularBanco(db: Banco): void {
  popularVeiculos(db)
  popularUsuarios(db)
  popularVagas(db)
  popularAcessos(db)
  popularTarifas(db)
}

function tabelaVazia(db: Banco, tabela: 'veiculos' | 'usuarios' | 'vagas' | 'acessos' | 'tarifas'): boolean {
  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM ${tabela}`).get() as { total: number }
  return total === 0
}

/**
 * Usado ao iniciar o servidor: popula apenas as tabelas vazias.
 * Assim, um banco antigo (só com veículos) ganha os usuários sem perder nada.
 */
export function popularTabelasVazias(db: Banco): string[] {
  const populadas: string[] = []
  if (tabelaVazia(db, 'veiculos')) { popularVeiculos(db); populadas.push('veiculos') }
  if (tabelaVazia(db, 'usuarios')) { popularUsuarios(db); populadas.push('usuarios') }
  if (tabelaVazia(db, 'vagas')) { popularVagas(db); populadas.push('vagas') }
  if (tabelaVazia(db, 'acessos')) { popularAcessos(db); populadas.push('acessos') }
  if (tabelaVazia(db, 'tarifas')) { popularTarifas(db); populadas.push('tarifas') }
  return populadas
}

/** Apaga todos os dados e insere novamente os registros de demonstração. */
export function resetarBanco(db: Banco): void {
  const resetar = db.transaction(() => {
    db.exec('DELETE FROM veiculos')
    db.exec('DELETE FROM usuarios')
    db.exec('DELETE FROM vagas')
    db.exec('DELETE FROM acessos')
    db.exec('DELETE FROM tarifas')
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('veiculos', 'usuarios', 'vagas', 'acessos', 'tarifas')") // reinicia os ids em 1
    popularBanco(db)
  })
  resetar()
}
