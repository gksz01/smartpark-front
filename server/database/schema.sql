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

CREATE TABLE IF NOT EXISTS tarifas (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id            TEXT    NOT NULL CHECK (tenant_id IN ('shopping', 'condominium', 'hospital', 'company')),
  nome                 TEXT    NOT NULL,
  tipo_estrategia      TEXT    NOT NULL CHECK (tipo_estrategia IN ('POR_HORA', 'DIARIA', 'ISENTA')),  -- qual Strategy usar
  valor                REAL    NOT NULL DEFAULT 0 CHECK (valor >= 0),  -- valor da hora ou da diária
  valor_maximo_diario  REAL,                                           -- teto diário (só POR_HORA)
  ativa                INTEGER NOT NULL DEFAULT 0 CHECK (ativa IN (0, 1))
);

-- No máximo UMA tarifa ativa por tenant: o próprio banco recusa uma segunda.
CREATE UNIQUE INDEX IF NOT EXISTS uma_tarifa_ativa_por_tenant ON tarifas (tenant_id) WHERE ativa = 1;

CREATE TABLE IF NOT EXISTS reservas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id       TEXT    NOT NULL CHECK (tenant_id IN ('shopping', 'condominium', 'hospital', 'company')),
  veiculo_id      INTEGER NOT NULL REFERENCES veiculos (id),
  vaga_id         INTEGER NOT NULL REFERENCES vagas (id),
  data            TEXT    NOT NULL,  -- AAAA-MM-DD
  hora            TEXT    NOT NULL,  -- HH:MM
  duracao_horas   INTEGER NOT NULL CHECK (duracao_horas > 0),
  valor_estimado  REAL    NOT NULL DEFAULT 0,  -- calculado pela Strategy da tarifa ativa
  status          TEXT    NOT NULL CHECK (status IN ('pendente', 'confirmada', 'cancelada', 'concluida'))
);

-- Uma vaga não pode ter duas reservas confirmadas ao mesmo tempo: o próprio banco recusa.
CREATE UNIQUE INDEX IF NOT EXISTS uma_reserva_confirmada_por_vaga ON reservas (vaga_id) WHERE status = 'confirmada';

CREATE TABLE IF NOT EXISTS convenios (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id        TEXT    NOT NULL CHECK (tenant_id IN ('shopping', 'condominium', 'hospital', 'company')),
  nome             TEXT    NOT NULL,
  tipo_beneficio   TEXT    NOT NULL CHECK (tipo_beneficio IN ('isencao', 'percentual', 'horasGratis')),  -- tipos da classe Convenio
  valor_beneficio  REAL    NOT NULL DEFAULT 0 CHECK (valor_beneficio >= 0),  -- percentual ou horas; 0 na isenção
  ativo            INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
  UNIQUE (tenant_id, nome)
);

CREATE TABLE IF NOT EXISTS atendimentos (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id           TEXT    NOT NULL CHECK (tenant_id IN ('shopping', 'condominium', 'hospital', 'company')),
  convenio_id         INTEGER NOT NULL REFERENCES convenios (id),
  numero              TEXT    NOT NULL,  -- formato ATD-00000 (regra da classe Atendimento)
  paciente            TEXT    NOT NULL,
  data_atendimento    TEXT    NOT NULL,  -- ISO 8601
  beneficio_aplicado  INTEGER NOT NULL DEFAULT 0 CHECK (beneficio_aplicado IN (0, 1)),  -- consumido no pagamento
  UNIQUE (tenant_id, numero)
);
