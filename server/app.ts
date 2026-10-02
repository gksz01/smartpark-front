import express from 'express'
import type { Banco } from './database/conexao'
import { criarRotasVeiculos } from './routes/veiculos'
import { resetarBanco } from './seed/seed'

/**
 * Monta a aplicação Express recebendo o banco por parâmetro.
 * Assim os testes podem usar um banco em memória.
 */
export function criarApp(db: Banco) {
  const app = express()
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/vehicles', criarRotasVeiculos(db))

  // Restaura os dados de demonstração (usado pelo botão "Restaurar dados").
  // Sem autenticação: aceitável apenas por ser um protótipo acadêmico local.
  app.post('/api/reset', (_req, res) => {
    resetarBanco(db)
    res.json({ mensagem: 'Banco restaurado com os dados de demonstração.' })
  })

  return app
}
