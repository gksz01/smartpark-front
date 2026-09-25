# SmartPark — Parte 3

Protótipo acadêmico de uma **Linha de Produto de Software (LPS)** para gestão e automação de estacionamentos. Uma única aplicação React adapta identidade visual, menus, campos, métricas e módulos conforme o cliente e o perfil selecionados.

## Executar localmente

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm run dev
```

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

Os dados são mockados e persistidos no `localStorage`. Use o botão de restauração na barra superior para recuperar o estado inicial da demonstração.

Consulte [docs/parte-3.md](docs/parte-3.md) para a arquitetura, matriz de variabilidade, controle de acesso e roteiro das 12 interfaces.
