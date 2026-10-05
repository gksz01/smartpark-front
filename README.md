# SmartPark — Parte 3

Protótipo acadêmico de uma **Linha de Produto de Software (LPS)** para gestão e automação de estacionamentos. Uma única aplicação React adapta identidade visual, menus, campos, métricas e módulos conforme o cliente e o perfil selecionados.

## Executar localmente

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm run dev
```

O comando `npm run dev` inicia juntos o frontend (Vite, porta 5174) e o backend (Express + SQLite, porta 3001). O Vite repassa as chamadas `/api` para o backend.

Abra `http://localhost:5174/`. Na tela inicial, escolha um dos quatro clientes e um perfil compatível.

Também é possível iniciar a apresentação por URL:

```text
/?tenant=shopping&role=driver&academic=1
/?tenant=condominium&role=resident&academic=1
/?tenant=hospital&role=admin&academic=1
/?tenant=company&role=employee&academic=1
```

## Qualidade

```bash
npm run lint
npm run test
npm run build
```

## Banco de dados

O backend fica em `server/` e grava no arquivo SQLite `server/database/smartpark.db`, criado automaticamente com dados de demonstração na primeira execução (o arquivo não vai para o Git).

- `npm run dev:api` — inicia só o backend.
- `npm run db:reset` — recria os dados de demonstração pelo terminal.
- O botão de restauração na barra superior chama `POST /api/reset` com o mesmo efeito.

Os 8 cadastros (Veículos, Pessoas, Vagas, Acessos, Tarifas, Reservas, Convênios e Pagamentos) são lidos e gravados no banco. Continuam mockados apenas os estacionamentos da busca e os indicadores do dashboard; o contexto (cliente, perfil e modo acadêmico) fica no `localStorage`.

## Reúso e compactação

A Parte 03 realizou a compactação e o reúso das estruturas repetidas dos 8 CRUDs, mantendo explícitas as regras específicas de negócio.

Foram criadas abstrações reutilizáveis para:

- formatação de moeda, hora e data;
- chamadas HTTP dos CRUDs;
- APIs falsas utilizadas nos testes;
- tratamento comum das rotas do backend;
- componentes de formulário e modal;
- ações de edição e exclusão;
- carregamento de dados por tenant;
- operações comuns de criar, editar e excluir;
- formulários declarativos configurados por entidade.

Entre os principais elementos reutilizáveis estão `FormModal`, `RowActions`, `SelectField`, `FormFields`, `useTenantData`, `useCrudForm`, `request()`, `createCrudApi()` e `createFakeCrudApi()`.

A comparação entre o estado anterior e posterior à compactação apresentou:

| Indicador | Antes | Depois |
|---|---:|---:|
| Linhas nos mesmos 32 arquivos | 4.518 | 3.518 |
| Linhas repetidas aproximadas | 946 | 515 |
| Modais montados manualmente | 7 | 0 |
| Cópias de `lerTenant` | 8 | 1 |
| Chamadas HTTP repetidas | 35 | 1 centralizada em `request()` |
| Testes | 359 | 379 |

Nos mesmos 32 arquivos analisados houve redução de 22,1% nas linhas e aproximadamente 46% nas linhas repetidas. Considerando também os novos arquivos criados especificamente para reúso, a redução líquida foi de aproximadamente 13,2%.

As regras específicas de negócio, como Strategy, Factory Method, Observer, transações, validações de reservas, pagamentos, convênios e acessos, permaneceram explícitas.

## Marcos do repositório

O histórico do projeto foi preservado por tags para permitir a comparação entre as etapas:

| Tag | Commit | Estado |
|---|---|---|
| `v0-base` | `710895c` | Projeto original antes da atividade |
| `antes-compactacao` | `21ccda9` | Sistema completo antes da Parte 03 |
| `depois-compactacao` | `e8b52fb` | Estado final após compactação e reúso |

Para visualizar as alterações realizadas na Parte 03:

```bash
git diff antes-compactacao depois-compactacao
```

Consulte [docs/parte-3.md](docs/parte-3.md) para a arquitetura, matriz de variabilidade, controle de acesso e os 8 CRUDs.
