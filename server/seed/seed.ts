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

export function popularBanco(db: Banco): void {
  popularVeiculos(db)
  popularUsuarios(db)
}

function tabelaVazia(db: Banco, tabela: 'veiculos' | 'usuarios'): boolean {
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
  return populadas
}

/** Apaga todos os dados e insere novamente os registros de demonstração. */
export function resetarBanco(db: Banco): void {
  const resetar = db.transaction(() => {
    db.exec('DELETE FROM veiculos')
    db.exec('DELETE FROM usuarios')
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('veiculos', 'usuarios')") // reinicia os ids em 1
    popularBanco(db)
  })
  resetar()
}
