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

export function popularBanco(db: Banco): void {
  const inserir = db.prepare(`
    INSERT INTO veiculos (tenant_id, apelido, placa, modelo, cor, unidade, tag_rfid)
    VALUES (@tenant_id, @apelido, @placa, @modelo, @cor, @unidade, @tag_rfid)
  `)
  for (const veiculo of VEICULOS_INICIAIS) inserir.run(veiculo)
}

/** Apaga todos os dados e insere novamente os registros de demonstração. */
export function resetarBanco(db: Banco): void {
  const resetar = db.transaction(() => {
    db.exec('DELETE FROM veiculos')
    db.exec("DELETE FROM sqlite_sequence WHERE name = 'veiculos'") // reinicia os ids em 1
    popularBanco(db)
  })
  resetar()
}

export function bancoVazio(db: Banco): boolean {
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM veiculos').get() as { total: number }
  return total === 0
}
