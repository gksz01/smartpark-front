# SmartPark (C#)

Migração do SmartPark para C# seguindo `docs/CODING_GUIDELINES.md`:
Blazor (Interactive Server) + ASP.NET Core + EF Core + SQLite, com Clean Architecture,
pastas por funcionalidade e CQRS pragmático.

## Como rodar

Pré-requisito: .NET SDK 10.

```bash
cd SmartPark
dotnet run --project src/SmartPark.Web
```

Abra o endereço mostrado no terminal (ex.: http://localhost:5002). Na primeira execução o banco
`smartpark.db` é criado com as migrações e populado com os dados de demonstração.
Para voltar aos dados iniciais, apague o arquivo `src/SmartPark.Web/smartpark.db` e rode de novo.

Na tela inicial escolha o cliente (variante da LPS) e o perfil. Perfis de portal (Motorista,
Morador, Funcionário) veem Veículos, Reservas e Pagamentos; Operador e Administrador veem as telas de gestão.

## Testes

```bash
dotnet test
```

## Estrutura

| Projeto | Responsabilidade |
|---|---|
| `SmartPark.Dominio` | Entidades, regras, LPS (`RegistroTenants`) e os padrões Strategy, Factory Method e Observer |
| `SmartPark.Aplicacao` | Casos de uso por funcionalidade (`Comando`/`Consulta` + `Manipulador`) |
| `SmartPark.Infraestrutura` | EF Core + SQLite, configurações, migrações e seed |
| `SmartPark.Compartilhado` | `Resultado` dos casos de uso |
| `SmartPark.Web` | Telas Blazor por funcionalidade e componentes reutilizáveis (`Compartilhado/Crud`) |

Migrações: `dotnet tool restore` e `dotnet ef migrations add <Nome> --project src/SmartPark.Infraestrutura --output-dir Persistencia/Migracoes`.
