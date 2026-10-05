// Recria os dados de demonstração pelo terminal: npm run db:reset
import { CAMINHO_BANCO } from '../config'
import { abrirBanco } from '../database/conexao'
import { contarLinhas, resetarBanco, TABELAS } from './seed'

const db = abrirBanco(CAMINHO_BANCO)
resetarBanco(db)
const resumo = TABELAS.map((tabela) => `${tabela}: ${contarLinhas(db, tabela)}`).join(', ')
console.log(`Banco restaurado em ${CAMINHO_BANCO} (${resumo}).`)
db.close()
