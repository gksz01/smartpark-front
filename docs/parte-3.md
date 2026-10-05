# SmartPark — Parte 3: variabilidade, personalização e reúso

## 1. Visão geral

O SmartPark foi implementado como uma Linha de Produto de Software. Uma única SPA React atende Shopping Center, Condomínio Residencial, Hospital e Empresa. A aplicação não mantém cópias das páginas por cliente: componentes, rotas, layouts e a API consultam a configuração central para decidir o que mostrar e permitir.

Os 8 CRUDs (Veículos, Pessoas, Vagas, Acessos, Tarifas, Reservas, Convênios e Pagamentos) são persistidos por um backend Express com banco SQLite (`server/`), sempre isolados por `tenant_id`. Continuam mockados apenas os estacionamentos da busca e os indicadores do dashboard. O protótipo é local: não existem integrações reais com sensores, leitores de placa, gateways de pagamento, mapas, autenticação ou cloud (sensor e pagamento são simulados).

## 2. Configuração por cliente

O catálogo central em `src/core/config.ts` define cada `TenantConfig`:

- identidade (`name`, `shortName`, `logo`, textos);
- tokens visuais (`primary`, `primaryStrong`, `secondary`, `accent`, `soft`, `surface`);
- método de acesso (`LPR`, `QR_CODE` ou `RFID`);
- feature flags;
- perfis permitidos;
- campos adicionais do formulário de veículos (`vehicleFields`);
- tipos de pessoa (`personTypes`) e tipos de vaga (`spaceTypes`);
- cards que compõem o dashboard.

O `TenantProvider` disponibiliza configuração e estado para toda a aplicação. O `TenantThemeProvider` converte os tokens em variáveis CSS. Assim, a marca muda sem carregar folhas de estilo diferentes.

### Matriz de features

| Feature | Shopping | Condomínio | Hospital | Empresa |
|---|:---:|:---:|:---:|:---:|
| Reserva | ON | OFF | OFF | OFF |
| Pagamento | ON | OFF | ON | OFF |
| Cobrança individual | ON | OFF | ON | OFF |
| Manobrista | ON | OFF | OFF | OFF |
| Gestão de visitantes | OFF | ON | OFF | ON |
| Convênio médico | OFF | OFF | ON | OFF |
| Relatórios | ON | ON | ON | ON |
| Notificações | ON | ON | ON | ON |
| White-label | ON | ON | ON | ON |

| Cliente | Método de acesso | Tema |
|---|---|---|
| Shopping Center Aurora | LPR | verde SmartPark e dourado |
| Residencial Horizonte | QR Code | azul residencial |
| Hospital Santa Clara | LPR | azul-esverdeado hospitalar |
| Nexora Tecnologia | RFID | grafite corporativo e laranja |

## 3. Controle por perfil

O RBAC é declarado em `ROLE_PERMISSIONS`. Menus e rotas usam a mesma fonte:

- Motorista: portal, busca, veículos, reserva e pagamento quando habilitados.
- Morador e Funcionário: portal e veículos.
- Visitante: portal e busca.
- Operador: vagas, entradas/saídas, pessoas e convênio quando habilitado.
- Administrador: dashboard, vagas, acessos, pessoas, tarifas (com cobrança), configuração e convênio quando habilitado.
- Manobrista: veículos e movimentações.

`FeatureGate` controla partes de uma interface. `RoleGate` controla conteúdo por papel. `ProtectedRoute` protege a navegação direta e informa se o bloqueio aconteceu por feature desligada ou permissão insuficiente. A API repete a checagem: módulos com feature desligada respondem 403.

## 4. Os 8 CRUDs

Cada CRUD permite cadastrar, listar, editar e excluir, gravando no SQLite pela API.

| CRUD | Tela | API | Tabela | Destaques |
|---|---|---|---|---|
| Veículos | `/app/vehicles` | `/api/vehicles` | `veiculos` | campos variáveis por `vehicleFields`; placa validada pela classe `Veiculo` |
| Pessoas | `/admin/users` | `/api/users` | `usuarios` | tipos por `personTypes` e perfis por `allowedRoles` |
| Vagas | `/admin/spaces` | `/api/spaces` | `vagas` | Factory Method por tipo; tipos por `spaceTypes`; "Simular sensor" (Observer) |
| Acessos | `/admin/access` | `/api/access` | `acessos` | identificador por `accessMethod`; decisões pela classe `Acesso` |
| Tarifas | `/admin/tariffs` | `/api/tariffs` | `tarifas` | Strategy de tarifa; uma tarifa ativa; só com `billing` |
| Reservas | `/app/reservations` | `/api/reservations` | `reservas` | Strategy na estimativa; Observer `EventosReserva`; só com `reservation` |
| Convênios | `/admin/medical-agreement` | `/api/agreements` | `convenios`, `atendimentos` | só com `medicalAgreement` (Hospital) |
| Pagamentos | `/app/payments` | `/api/payments` | `pagamentos` | Strategy de pagamento e `TarifaComConvenio`; estorno; só com `billing` |

As demais telas completam a experiência: seleção de cliente e perfil (`/`), home (`/app/home`), busca e detalhe de estacionamentos (`/app/parking`), dashboard (`/admin/dashboard`) e configuração (`/admin/configuration`). Todas apresentam o bloco **“Variabilidade desta tela”** quando o modo acadêmico está ligado.

## 5. Módulo exclusivo do Hospital

O módulo de Convênio Médico combina o CRUD de convênios com a validação de atendimentos gravados no banco:

1. informar o atendimento (use `ATD-48291` na apresentação);
2. localizar paciente e convênio pela API;
3. validar a elegibilidade com a classe `Atendimento` (convênio ativo, até 24 horas, benefício ainda não usado);
4. apresentar o benefício descrito pela classe `Convenio` (isenção, desconto ou horas grátis);
5. consumir o benefício no pagamento, onde `TarifaComConvenio` calcula o valor final.

O item só aparece no menu quando `medicalAgreement=true` e o perfil possui permissão. Acesso direto por outro tenant mostra uma página de bloqueio. O módulo reutiliza `AdminLayout`, `Card`, `FormField`, `Button`, `Alert`, `StatusBadge`, tema e autorização comuns.

## 6. Reúso e modularização

- `src/core`: contratos, catálogo de tenants, permissões, providers e gates.
- `src/domain`: classes de domínio e os padrões Strategy, Factory Method e Observer.
- `src/services`: chamadas à API (`request()` e `createCrudApi()`).
- `src/shared`: design system, layouts e componentes e hooks reutilizáveis dos CRUDs (`src/shared/crud`).
- `src/features`: módulos de seleção, estacionamento, veículos, pessoas, tarifas e administração.
- `src/data`: mocks restantes (estacionamentos da busca).
- `server`: API Express, schema SQLite, seed e testes de API.

Exemplos de reúso visível:

- um único dashboard recebe listas diferentes de métricas;
- um único formulário de veículo recebe campos extras declarativos;
- uma única tabela de acesso troca placa, QR ou RFID;
- uma única página de detalhes aplica gates de preço, reserva e manobrista;
- menus e rotas consomem a mesma matriz de features e permissões.

## 7. Roteiro de apresentação

Os dados dos CRUDs ficam no SQLite. O `localStorage` (chave `smartpark:parte3:v1`) guarda apenas o contexto da apresentação: cliente, perfil e modo acadêmico. A query string tem prioridade na abertura. Parâmetros suportados:

- `tenant`: `shopping`, `condominium`, `hospital`, `company`;
- `role`: `driver`, `resident`, `employee`, `visitor`, `operator`, `admin`, `valet`;
- `academic`: `1` para exibir explicações ou `0` para ocultá-las.

Sugestão de capturas:

1. Shopping + Motorista: home, busca, detalhe, reserva, veículos e pagamento.
2. Shopping + Administrador: dashboard, vagas, acessos e configuração.
3. Condomínio + Morador: home azul com autorização de visitante, QR Code e sem cobrança.
4. Empresa + Administrador: dashboard corporativo, acessos RFID e configuração.
5. Hospital + Administrador: dashboard com convênios e módulo exclusivo.

O ícone de engrenagem na barra acadêmica volta à seleção. O ícone de restauração chama `POST /api/reset`, que recria os dados de demonstração no banco.
