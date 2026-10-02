// Recria os dados de demonstração pelo terminal: npm run db:reset
import { CAMINHO_BANCO } from '../config'
import { abrirBanco } from '../database/conexao'
import { resetarBanco } from './seed'

const db = abrirBanco(CAMINHO_BANCO)
resetarBanco(db)
const { total } = db.prepare('SELECT COUNT(*) AS total FROM veiculos').get() as { total: number }
console.log(`Banco restaurado em ${CAMINHO_BANCO} (${total} veículos).`)
db.close()
