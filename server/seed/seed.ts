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

export function popularBanco(db: Banco): void {
  popularVeiculos(db)
  popularUsuarios(db)
  popularVagas(db)
}

function tabelaVazia(db: Banco, tabela: 'veiculos' | 'usuarios' | 'vagas'): boolean {
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
  return populadas
}

/** Apaga todos os dados e insere novamente os registros de demonstração. */
export function resetarBanco(db: Banco): void {
  const resetar = db.transaction(() => {
    db.exec('DELETE FROM veiculos')
    db.exec('DELETE FROM usuarios')
    db.exec('DELETE FROM vagas')
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('veiculos', 'usuarios', 'vagas')") // reinicia os ids em 1
    popularBanco(db)
  })
  resetar()
}
