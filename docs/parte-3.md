# SmartPark — Parte 3: variabilidade, personalização e reúso

## 1. Visão geral

O SmartPark foi implementado como uma Linha de Produto de Software no frontend. Uma única SPA React atende Shopping Center, Condomínio Residencial, Hospital e Empresa. A aplicação não mantém cópias das páginas por cliente: componentes, rotas e layouts consultam a configuração central para decidir o que mostrar e permitir.

O protótipo é local e usa dados mockados. Não existem integrações reais com sensores, leitores de placa, pagamento, mapas, autenticação ou cloud.

## 2. Configuração por cliente

O catálogo central em `src/core/config.ts` define cada `TenantConfig`:

- identidade (`name`, `shortName`, `logo`, textos);
- tokens visuais (`primary`, `primaryStrong`, `secondary`, `accent`, `soft`, `surface`);
- método de acesso (`LPR`, `QR_CODE` ou `RFID`);
- feature flags;
- perfis permitidos;
- campos adicionais do formulário de veículos;
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
- Operador: vagas, entradas/saídas e convênio quando habilitado.
- Administrador: dashboard, vagas, acessos, configuração e convênio quando habilitado.
- Manobrista: veículos e movimentações.

`FeatureGate` controla partes de uma interface. `RoleGate` controla conteúdo por papel. `ProtectedRoute` protege a navegação direta e informa se o bloqueio aconteceu por feature desligada ou permissão insuficiente.

## 4. As 12 interfaces

1. `/` — seleção de cliente e perfil, resumo das features e ativação do modo acadêmico.
2. `/app/home` — home adaptativa do usuário com estacionamento ativo, ações rápidas, próximos locais, veículos e histórico.
3. `/app/parking` — busca, filtros variáveis e mapa esquemático mockado.
4. `/app/parking/central` — detalhes, ocupação, preço condicional, serviços e método de acesso.
5. `/app/reservations/new` — reserva funcional, disponível apenas no Shopping.
6. `/app/vehicles` — CRUD de veículos com formulário composto por configuração.
7. `/app/payments` — pagamento e comprovante mockados, disponível no Shopping e Hospital.
8. `/admin/dashboard` — cards administrativos compostos por tenant.
9. `/admin/spaces` — vagas, setores, categorias e filtros.
10. `/admin/access` — entradas/saídas com identificador variável e liberação manual.
11. `/admin/configuration` — tema, método, flags e perfis da variante ativa.
12. `/admin/medical-agreement` — fluxo exclusivo de convênio do Hospital.

Todas apresentam o bloco **“Variabilidade desta tela”** quando o modo acadêmico está ligado.

## 5. Módulo exclusivo do Hospital

O módulo de Convênio Médico implementa um fluxo mockado completo:

1. informar o atendimento (use `ATD-48291` na apresentação);
2. localizar paciente e convênio;
3. validar elegibilidade;
4. apresentar desconto ou isenção;
5. aplicar o benefício;
6. emitir confirmação persistida.

O item só aparece no menu quando `medicalAgreement=true` e o perfil possui permissão. Acesso direto por outro tenant mostra uma página de bloqueio. O módulo reutiliza `AdminLayout`, `Card`, `FormField`, `Button`, `Alert`, `StatusBadge`, tema e autorização comuns.

## 6. Reúso e modularização

- `src/core`: contratos, catálogo de tenants, permissões, providers e gates.
- `src/shared`: design system e layouts reutilizáveis.
- `src/features`: módulos de seleção, estacionamento, veículos e administração.
- `src/data`: mocks compartilhados entre as interfaces.

Exemplos de reúso visível:

- um único dashboard recebe listas diferentes de métricas;
- um único formulário de veículo recebe campos extras declarativos;
- uma única tabela de acesso troca placa, QR ou RFID;
- uma única página de detalhes aplica gates de preço, reserva e manobrista;
- menus e rotas consomem a mesma matriz de features e permissões.

## 7. Roteiro de apresentação

O estado é armazenado na chave `smartpark:parte3:v1` do `localStorage`. A query string tem prioridade na abertura. Parâmetros suportados:

- `tenant`: `shopping`, `condominium`, `hospital`, `company`;
- `role`: `driver`, `resident`, `employee`, `visitor`, `operator`, `admin`, `valet`;
- `academic`: `1` para exibir explicações ou `0` para ocultá-las.

Sugestão de capturas:

1. Shopping + Motorista: home, busca, detalhe, reserva, veículos e pagamento.
2. Shopping + Administrador: dashboard, vagas, acessos e configuração.
3. Condomínio + Morador: home azul com autorização de visitante, QR Code e sem cobrança.
4. Empresa + Administrador: dashboard corporativo, acessos RFID e configuração.
5. Hospital + Administrador: dashboard com convênios e módulo exclusivo.

O ícone de engrenagem na barra acadêmica volta à seleção. O ícone de restauração repõe todos os mocks iniciais.
