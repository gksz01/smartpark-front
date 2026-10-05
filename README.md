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

Veículos, Pessoas (`/admin/users`), Vagas (`/admin/spaces`) Acessos (`/admin/access`) Tarifas (`/admin/tariffs`) e Reservas (`/app/reservations`) já são lidos e gravados no banco. Os demais dados ainda são mockados e o contexto (cliente, perfil e modo acadêmico) continua no `localStorage`.

Consulte [docs/parte-3.md](docs/parte-3.md) para a arquitetura, matriz de variabilidade, controle de acesso e roteiro das 12 interfaces.
