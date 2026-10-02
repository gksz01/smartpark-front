-- SmartPark: estrutura do banco SQLite.
-- Executado sempre que o servidor abre o banco (IF NOT EXISTS evita recriar).

CREATE TABLE IF NOT EXISTS veiculos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id  TEXT    NOT NULL CHECK (tenant_id IN ('shopping', 'condominium', 'hospital', 'company')),
  apelido    TEXT    NOT NULL,
  placa      TEXT    NOT NULL,
  modelo     TEXT    NOT NULL,
  cor        TEXT    NOT NULL,
  unidade    TEXT,             -- campo variável do Condomínio
  tag_rfid   TEXT,             -- campo variável da Empresa
  UNIQUE (tenant_id, placa)    -- a mesma placa não se repete dentro de um cliente
);
