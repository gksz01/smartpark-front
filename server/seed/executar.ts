// Recria os dados de demonstração pelo terminal: npm run db:reset
import { CAMINHO_BANCO } from '../config'
import { abrirBanco } from '../database/conexao'
import { resetarBanco } from './seed'

const db = abrirBanco(CAMINHO_BANCO)
resetarBanco(db)
const veiculos = db.prepare('SELECT COUNT(*) AS total FROM veiculos').get() as { total: number }
const usuarios = db.prepare('SELECT COUNT(*) AS total FROM usuarios').get() as { total: number }
const vagas = db.prepare('SELECT COUNT(*) AS total FROM vagas').get() as { total: number }
const acessos = db.prepare('SELECT COUNT(*) AS total FROM acessos').get() as { total: number }
const tarifas = db.prepare('SELECT COUNT(*) AS total FROM tarifas').get() as { total: number }
const reservas = db.prepare('SELECT COUNT(*) AS total FROM reservas').get() as { total: number }
const convenios = db.prepare('SELECT COUNT(*) AS total FROM convenios').get() as { total: number }
const atendimentos = db.prepare('SELECT COUNT(*) AS total FROM atendimentos').get() as { total: number }
console.log(`Banco restaurado em ${CAMINHO_BANCO} (${veiculos.total} veículos, ${usuarios.total} usuários, ${vagas.total} vagas, ${acessos.total} acessos, ${tarifas.total} tarifas, ${reservas.total} reservas, ${convenios.total} convênios, ${atendimentos.total} atendimentos).`)
db.close()
