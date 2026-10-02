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

CREATE TABLE IF NOT EXISTS usuarios (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id  TEXT    NOT NULL CHECK (tenant_id IN ('shopping', 'condominium', 'hospital', 'company')),
  nome       TEXT    NOT NULL,
  documento  TEXT    NOT NULL,
  tipo       TEXT    NOT NULL,  -- a API aceita só os personTypes do tenant
  perfil     TEXT    NOT NULL,  -- a API aceita só os allowedRoles do tenant
  ativo      INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
  UNIQUE (tenant_id, documento) -- o mesmo documento não se repete dentro de um cliente
);
