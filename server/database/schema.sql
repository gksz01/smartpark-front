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

CREATE TABLE IF NOT EXISTS vagas (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id  TEXT    NOT NULL CHECK (tenant_id IN ('shopping', 'condominium', 'hospital', 'company')),
  codigo     TEXT    NOT NULL,
  setor      TEXT    NOT NULL,
  tipo       TEXT    NOT NULL,  -- a API aceita só os spaceTypes do tenant
  status     TEXT    NOT NULL DEFAULT 'Livre' CHECK (status IN ('Livre', 'Ocupada', 'Bloqueada', 'Reservada')),
  UNIQUE (tenant_id, codigo)    -- o mesmo código não se repete dentro de um cliente
);

CREATE TABLE IF NOT EXISTS acessos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id       TEXT    NOT NULL CHECK (tenant_id IN ('shopping', 'condominium', 'hospital', 'company')),
  pessoa          TEXT    NOT NULL,
  identificador   TEXT    NOT NULL,  -- placa, código QR ou tag RFID
  metodo          TEXT    NOT NULL CHECK (metodo IN ('LPR', 'QR_CODE', 'RFID', 'MANUAL')),  -- a API exige o accessMethod do tenant
  direcao         TEXT    NOT NULL CHECK (direcao IN ('Entrada', 'Saída')),
  status          TEXT    NOT NULL CHECK (status IN ('Liberado', 'Pendente', 'Negado')),
  manual          INTEGER NOT NULL DEFAULT 0 CHECK (manual IN (0, 1)),  -- 1 = liberação manual do operador
  motivo_negacao  TEXT,
  horario         TEXT    NOT NULL   -- data e hora em ISO 8601
);
