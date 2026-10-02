// Ponto de entrada do backend: npm run dev:api (ou npm run dev, junto com o frontend)
import { criarApp } from './app'
import { CAMINHO_BANCO, PORTA } from './config'
import { abrirBanco } from './database/conexao'
import { bancoVazio, popularBanco } from './seed/seed'

const db = abrirBanco(CAMINHO_BANCO)
if (bancoVazio(db)) {
  popularBanco(db)
  console.log('Banco novo: dados de demonstração inseridos.')
}

criarApp(db).listen(PORTA, () => {
  console.log(`API SmartPark em http://localhost:${PORTA} · banco: ${CAMINHO_BANCO}`)
})
