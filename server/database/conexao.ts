import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'

const SCHEMA = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')

export type Banco = Database.Database

/**
 * Abre (ou cria) o arquivo SQLite e garante que as tabelas existam.
 * Use ':memory:' para um banco temporário, como nos testes.
 */
export function abrirBanco(caminho: string): Banco {
  const db = new Database(caminho)
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  return db
}
