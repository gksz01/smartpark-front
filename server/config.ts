import { fileURLToPath } from 'node:url'

export const PORTA = Number(process.env.PORT ?? 3001)

/** Arquivo do banco SQLite (fica fora do Git, ver .gitignore). */
export const CAMINHO_BANCO = fileURLToPath(new URL('./database/smartpark.db', import.meta.url))
