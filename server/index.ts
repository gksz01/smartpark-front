// Ponto de entrada do backend: npm run dev:api (ou npm run dev, junto com o frontend)
import { criarApp } from './app'
import { CAMINHO_BANCO, PORTA } from './config'
import { abrirBanco } from './database/conexao'
import { popularTabelasVazias } from './seed/seed'

const db = abrirBanco(CAMINHO_BANCO)
const populadas = popularTabelasVazias(db)
if (populadas.length) {
  console.log(`Dados de demonstração inseridos em: ${populadas.join(', ')}.`)
}

criarApp(db).listen(PORTA, () => {
  console.log(`API SmartPark em http://localhost:${PORTA} · banco: ${CAMINHO_BANCO}`)
})
