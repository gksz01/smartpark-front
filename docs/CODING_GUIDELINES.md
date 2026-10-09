# CODING_GUIDELINES.md — SmartPark

## 1. Objetivo

Este documento define os padrões de arquitetura, organização, nomenclatura e qualidade de código do **SmartPark** na versão baseada em **C# + Blazor + ASP.NET Core + Entity Framework Core + SQLite**.

O objetivo principal é manter o projeto fácil de entender, testar, evoluir e apresentar academicamente, preservando de forma explícita:

- as classes e regras de domínio;
- os padrões Strategy, Factory Method e Observer;
- a Linha de Produto de Software (LPS) e suas variabilidades;
- os oito CRUDs;
- a separação entre interface, casos de uso, domínio e infraestrutura;
- o reúso e a compactação de código.

> **Regra de idioma:** todo código próprio do projeto deve utilizar **português** em nomes de classes, métodos, propriedades, variáveis, pastas de funcionalidades e comentários. Nomes exigidos por frameworks, bibliotecas, protocolos e APIs externas podem permanecer no formato original.

---

## 2. Stack oficial

- **Linguagem:** C#
- **Interface:** Blazor
- **Backend:** ASP.NET Core
- **Persistência:** Entity Framework Core
- **Banco de dados:** SQLite
- **Testes:** xUnit ou framework de testes definido pelo projeto
- **Arquitetura macro:** separação inspirada em Clean Architecture
- **Organização dos casos de uso:** Vertical Slice Architecture
- **Domínio:** DDD leve
- **Operações:** CQRS pragmático, separando comandos e consultas quando isso melhorar a clareza

Não adicionar bibliotecas ou abstrações arquiteturais apenas por convenção. Toda dependência deve resolver um problema real do projeto.

---

## 3. Estrutura da solução

```text
SmartPark/
├── SmartPark.sln
├── src/
│   ├── SmartPark.Dominio/
│   ├── SmartPark.Aplicacao/
│   ├── SmartPark.Infraestrutura/
│   ├── SmartPark.Web/
│   └── SmartPark.Compartilhado/
└── tests/
    ├── SmartPark.Dominio.Testes/
    ├── SmartPark.Aplicacao.Testes/
    └── SmartPark.Integracao.Testes/
```

### Dependências permitidas

```text
Web ───────────────► Aplicacao
Web ───────────────► Compartilhado
Aplicacao ─────────► Dominio
Aplicacao ─────────► Compartilhado
Infraestrutura ────► Dominio
Infraestrutura ────► Aplicacao
```

O projeto **Dominio não deve depender de Web, Aplicacao, Infraestrutura, Blazor, EF Core ou SQLite**.

---

## 4. SmartPark.Dominio

Contém o núcleo do sistema: entidades, regras de negócio, objetos de valor, eventos e padrões de projeto.

Estrutura sugerida:

```text
SmartPark.Dominio/
├── Entidades/
│   ├── Usuario.cs
│   ├── Veiculo.cs
│   ├── Estacionamento.cs
│   ├── Vaga.cs
│   ├── Reserva.cs
│   ├── Pagamento.cs
│   ├── Acesso.cs
│   ├── Sensor.cs
│   ├── Tarifa.cs
│   ├── Convenio.cs
│   ├── Atendimento.cs
│   └── Notificacao.cs
├── Enumeradores/
├── Eventos/
├── Excecoes/
├── ObjetosDeValor/
├── LinhaDeProduto/
└── Padroes/
    ├── Estrategia/
    │   ├── Tarifas/
    │   └── Pagamentos/
    ├── Fabrica/
    │   ├── Vagas/
    │   └── Variantes/
    └── Observador/
        ├── Sensores/
        └── Reservas/
```

### Regras do domínio

1. Entidades devem proteger suas próprias invariantes sempre que possível.
2. Regras de negócio não devem ficar em componentes `.razor`.
3. Regras de negócio não devem depender de `DbContext`.
4. Uma entidade não deve ser apenas um conjunto de propriedades públicas sem comportamento quando houver regra de negócio associada.
5. Evitar setters públicos indiscriminados. Preferir métodos que expressem intenção.

Exemplo:

```csharp
public class Reserva
{
    public StatusReserva Status { get; private set; }

    public void Confirmar()
    {
        if (Status == StatusReserva.Cancelada)
            throw new RegraDeNegocioException("Uma reserva cancelada não pode ser confirmada.");

        Status = StatusReserva.Confirmada;
    }
}
```

Preferir `reserva.Confirmar()` a `reserva.Status = StatusReserva.Confirmada`.

---

## 5. Padrões de projeto

Os padrões utilizados no trabalho devem permanecer identificáveis no código. Não esconder suas implementações em abstrações genéricas que dificultem a demonstração acadêmica.

### 5.1 Strategy — Estratégia

Usar para comportamentos intercambiáveis.

Exemplos oficiais do SmartPark:

- estratégia de tarifa;
- estratégia de pagamento.

Estrutura sugerida:

```text
Padroes/Estrategia/Tarifas/
├── IEstrategiaTarifa.cs
├── TarifaPorHora.cs
├── TarifaFixaDiaria.cs
├── TarifaIsenta.cs
└── TarifaComConvenio.cs

Padroes/Estrategia/Pagamentos/
├── IEstrategiaPagamento.cs
├── PagamentoPix.cs
├── PagamentoCredito.cs
└── PagamentoDebito.cs
```

Interfaces devem começar com `I` conforme convenção do C#.

### 5.2 Factory Method — Método Fábrica

Usar quando subclasses ou criadores especializados determinam qual objeto concreto deve ser criado.

Exemplos oficiais:

- criação dos diferentes tipos de vaga;
- criação/configuração das variantes SmartPark.

Não substituir o padrão por um `switch` gigante espalhado pelo sistema.

### 5.3 Observer — Observador

Usar quando um evento deve avisar interessados sem acoplamento direto entre todos os participantes.

Exemplos oficiais:

- eventos do Sensor;
- eventos da Reserva.

A persistência provocada por um evento deve ocorrer em uma camada apropriada. O domínio não deve conhecer SQLite ou EF Core.

---

## 6. Linha de Produto de Software — LPS

A variabilidade do SmartPark deve continuar centralizada.

Variantes oficiais:

- Shopping;
- Hospital;
- Condominio;
- Empresa.

Evitar código como:

```csharp
if (tenant == "hospital")
{
    // regra espalhada pela aplicação
}
```

Preferir uma definição central:

```text
LinhaDeProduto/
├── DefinicaoTenant.cs
├── RecursosTenant.cs
├── TemaTenant.cs
├── RegistroTenants.cs
└── Tipos/
```

Exemplo conceitual:

```csharp
public sealed class DefinicaoTenant
{
    public required string Identificador { get; init; }
    public required string Nome { get; init; }
    public required RecursosTenant Recursos { get; init; }
    public IReadOnlyCollection<TipoVaga> TiposVaga { get; init; } = [];
}
```

A configuração deve controlar, conforme necessário:

- recursos habilitados;
- método de acesso;
- tipos de vaga;
- campos de veículo;
- tipos de pessoa;
- perfis permitidos;
- tema;
- reservas;
- cobrança;
- convênio médico;
- valet;
- visitantes;
- notificações e relatórios.

A interface pode esconder um recurso desabilitado, mas a aplicação/backend também deve validar a disponibilidade. Segurança e regra de negócio nunca podem depender somente da interface.

---

## 7. SmartPark.Aplicacao

A camada de aplicação representa os **casos de uso**. Organizar por funcionalidade, e não por tipo técnico global.

```text
SmartPark.Aplicacao/
├── Veiculos/
│   ├── Criar/
│   │   ├── CriarVeiculoComando.cs
│   │   ├── CriarVeiculoManipulador.cs
│   │   └── CriarVeiculoValidador.cs
│   ├── Atualizar/
│   ├── Excluir/
│   ├── ObterPorId/
│   └── Listar/
├── Pessoas/
├── Vagas/
├── Acessos/
├── Tarifas/
├── Reservas/
├── Convenios/
└── Pagamentos/
```

### Regra principal

Se a alteração é sobre Reserva, deve ser possível começar a investigação em:

```text
Aplicacao/Reservas/
```

Evitar espalhar um único caso de uso por pastas globais como:

```text
Controllers/
Services/
DTOs/
Validators/
```

---

## 8. CQRS pragmático

Separar operações que alteram estado das operações de leitura quando isso tornar o fluxo mais claro.

### Comandos

```text
CriarVeiculoComando
AtualizarVeiculoComando
ExcluirVeiculoComando
ConfirmarReservaComando
CancelarReservaComando
EstornarPagamentoComando
```

### Consultas

```text
ListarVeiculosConsulta
ObterVeiculoPorIdConsulta
ListarReservasConsulta
ListarPagamentosConsulta
```

### Manipuladores

Usar o sufixo `Manipulador`:

```csharp
public sealed class CriarVeiculoManipulador
{
    public async Task<Resultado<VeiculoDto>> ExecutarAsync(
        CriarVeiculoComando comando,
        CancellationToken cancellationToken)
    {
        // caso de uso
    }
}
```

Não é obrigatório usar MediatR. Se chamadas diretas mantiverem o código mais simples, preferi-las.

---

## 9. SmartPark.Infraestrutura

Responsável por persistência e detalhes tecnológicos.

```text
SmartPark.Infraestrutura/
├── Persistencia/
│   ├── SmartParkDbContext.cs
│   ├── Configuracoes/
│   │   ├── VeiculoConfiguracao.cs
│   │   ├── UsuarioConfiguracao.cs
│   │   ├── VagaConfiguracao.cs
│   │   ├── ReservaConfiguracao.cs
│   │   ├── TarifaConfiguracao.cs
│   │   └── PagamentoConfiguracao.cs
│   └── Migracoes/
├── Repositorios/
├── Seed/
│   └── PopuladorBanco.cs
└── InjecaoDeDependencia.cs
```

### Entity Framework Core

- Configurações de mapeamento devem preferencialmente utilizar `IEntityTypeConfiguration<T>`.
- Evitar colocar toda a configuração das entidades dentro de `OnModelCreating`.
- Migrações ficam exclusivamente em Infraestrutura.
- O domínio não recebe atributos de persistência quando for possível configurar o mapeamento externamente.

### Repositórios

Não criar `IRepositorioGenerico<T>` apenas para esconder todos os recursos do EF Core.

Criar repositório específico somente quando ele representar uma abstração útil do domínio ou uma consulta/persistência complexa reutilizável.

---

## 10. Banco de dados

Manter inicialmente o SQLite, preservando o comportamento já existente.

Entidades persistidas atualmente:

1. Veiculos;
2. Usuarios;
3. Vagas;
4. Acessos;
5. Tarifas;
6. Reservas;
7. Convenios;
8. Atendimentos;
9. Pagamentos.

### Convenções

No C#:

```csharp
VeiculoId
TenantId
CriadoEm
AtualizadoEm
```

No banco, escolher uma convenção única e não misturá-la. Se utilizar a convenção gerada pelo EF Core, mantê-la de forma consistente.

Índices únicos, chaves estrangeiras e restrições de integridade devem continuar existindo mesmo quando a aplicação também realiza validação.

---

## 11. SmartPark.Web — Blazor

A interface também deve ser organizada por funcionalidade.

```text
SmartPark.Web/
├── Funcionalidades/
│   ├── Veiculos/
│   │   ├── Paginas/
│   │   │   └── Veiculos.razor
│   │   └── Componentes/
│   │       ├── FormularioVeiculo.razor
│   │       └── TabelaVeiculos.razor
│   ├── Pessoas/
│   ├── Vagas/
│   ├── Acessos/
│   ├── Tarifas/
│   ├── Reservas/
│   ├── Convenios/
│   └── Pagamentos/
├── Compartilhado/
│   ├── Crud/
│   │   ├── ModalFormulario.razor
│   │   ├── AcoesLinha.razor
│   │   ├── CampoSelecao.razor
│   │   └── CamposFormulario.razor
│   ├── Feedback/
│   └── Tabelas/
├── Layout/
└── wwwroot/
```

### Componentes `.razor`

Um componente deve cuidar principalmente de apresentação e interação.

Evitar:

- SQL em `.razor`;
- acesso direto ao `DbContext` em componentes;
- regras complexas de tarifa em componentes;
- regras de reserva em componentes;
- lógica de LPS duplicada em várias páginas.

O componente chama um caso de uso e apresenta o resultado.

---

## 12. Reúso de interface

Preservar o princípio da compactação já aplicado no projeto anterior.

Equivalências esperadas na migração:

```text
FormModal.tsx      -> ModalFormulario.razor
RowActions.tsx     -> AcoesLinha.razor
SelectField.tsx    -> CampoSelecao.razor
FormFields.tsx     -> CamposFormulario.razor
```

Antes de criar um novo componente, verificar se a estrutura é realmente específica ou se pertence à pasta `Compartilhado`.

Não criar componente genérico tão configurável que fique mais difícil de entender do que componentes específicos.

---

## 13. Convenções de nomenclatura C# em português

Seguir as convenções idiomáticas do C#, traduzindo o vocabulário de domínio.

### Classes, interfaces, enums, métodos e propriedades

Usar `PascalCase`:

```csharp
public class Veiculo
public interface IEstrategiaPagamento
public enum StatusReserva
public string NumeroPlaca { get; private set; }
public void ConfirmarReserva()
```

### Variáveis locais e parâmetros

Usar `camelCase`:

```csharp
var veiculoEncontrado = ...;
var valorTotal = ...;

public void Reservar(Veiculo veiculo, DateTime inicio)
```

### Campos privados

Usar `_camelCase`:

```csharp
private readonly SmartParkDbContext _contexto;
private readonly ILogger<CriarVeiculoManipulador> _logger;
```

### Assíncrono

Métodos assíncronos terminam em `Async`:

```csharp
ListarAsync()
SalvarAsync()
ExecutarAsync()
```

### Booleanos

Nomes devem expressar uma pergunta ou estado:

```csharp
Ativo
Pago
Cancelado
PodeReservar
PossuiConvenio
EstaDisponivel
```

Evitar:

```csharp
Flag
StatusBool
ValorBooleano
```

---

## 14. Vocabulário oficial

Usar sempre os mesmos termos no código.

| Conceito | Nome no código |
|---|---|
| Vehicle | Veiculo |
| User | Usuario |
| Parking Space | Vaga |
| Reservation | Reserva |
| Payment | Pagamento |
| Access | Acesso |
| Sensor | Sensor |
| Tariff | Tarifa |
| Agreement | Convenio |
| Service/Attendance | Atendimento |
| Notification | Notificacao |
| Tenant | Tenant |
| Feature | Recurso |
| Strategy | Estrategia |
| Factory | Fabrica |
| Observer | Observador |
| Command | Comando |
| Query | Consulta |
| Handler | Manipulador |

`Tenant` pode permanecer como termo técnico central do projeto para evitar ambiguidades. Não alternar entre `Tenant`, `Cliente`, `EmpresaCliente` e `Locatario` para representar o mesmo conceito.

---

## 15. Métodos e responsabilidades

Métodos devem fazer uma coisa principal e ter nomes que revelem intenção.

Preferir:

```csharp
CalcularValor()
ConfirmarReserva()
ConsumirBeneficio()
ValidarElegibilidade()
RegistrarEntrada()
EstornarPagamento()
```

Evitar:

```csharp
Processar()
ExecutarCoisas()
HandleData()
DoStuff()
```

Não criar métodos excessivamente pequenos apenas para reduzir número de linhas. Extraia quando existir responsabilidade, conceito ou comportamento reutilizável.

---

## 16. Tratamento de erros

Diferenciar erros de domínio, validação, inexistência e infraestrutura.

Exemplos:

```text
RegraDeNegocioException
EntidadeNaoEncontradaException
RecursoTenantDesabilitadoException
ConflitoDeReservaException
```

Não usar `catch (Exception)` para esconder erros e retornar uma mensagem genérica em todas as camadas.

Mensagens apresentadas ao usuário devem ser compreensíveis e não expor stack trace, SQL ou detalhes internos.

---

## 17. Resultados de casos de uso

Quando uma operação puder falhar por motivos esperados, preferir um resultado explícito em vez de usar exceções para todo fluxo de controle.

Exemplo conceitual:

```csharp
public sealed record Resultado<T>(
    bool Sucesso,
    T? Dados,
    string? Erro);
```

Exceções continuam apropriadas para invariantes quebradas e falhas inesperadas.

---

## 18. DTOs e modelos de tela

Não expor entidades de domínio diretamente para formulários quando a tela exigir estrutura diferente ou permitir alterações que não pertencem à entidade.

Exemplos:

```text
VeiculoDto
CriarVeiculoComando
AtualizarVeiculoComando
PagamentoDto
ReservaDto
```

Evitar criar DTO para absolutamente tudo sem necessidade. A separação deve ter propósito.

---

## 19. Injeção de dependência

Registrar dependências por camada.

Exemplo:

```csharp
builder.Services
    .AdicionarAplicacao()
    .AdicionarInfraestrutura(builder.Configuration);
```

Cada projeto pode expor seu método de registro:

```text
Aplicacao/InjecaoDeDependencia.cs
Infraestrutura/InjecaoDeDependencia.cs
```

Evitar dezenas de registros espalhados em `Program.cs`.

---

## 20. Testes

A migração não deve reduzir a confiança existente no projeto.

Estrutura:

```text
tests/
├── SmartPark.Dominio.Testes/
├── SmartPark.Aplicacao.Testes/
└── SmartPark.Integracao.Testes/
```

### Domínio

Testar:

- entidades;
- regras de negócio;
- Strategy;
- Factory Method;
- Observer;
- LPS quando houver regra de domínio.

### Aplicação

Testar casos de uso:

- criação;
- atualização;
- exclusão;
- conflitos;
- recursos desabilitados por tenant;
- fluxos especiais.

### Integração

Testar:

- EF Core + SQLite;
- persistência;
- constraints;
- endpoints quando existirem;
- fluxos completos relevantes.

### Nome dos testes

Usar nomes descritivos em português:

```csharp
[Fact]
public void Confirmar_DeveReservarVaga_QuandoReservaForValida()
```

ou:

```csharp
[Fact]
public async Task CriarAsync_DeveFalhar_QuandoPlacaJaExistirNoTenant()
```

Padrão recomendado:

```text
Metodo_DeveResultado_QuandoCondicao
```

---

## 21. Comentários

Comentários devem explicar **por que**, não repetir **o que** o código já mostra.

Ruim:

```csharp
// Incrementa o contador
contador++;
```

Bom:

```csharp
// A reserva confirmada precisa bloquear a vaga na mesma transação
// para impedir duas reservas simultâneas.
```

Não manter código comentado. O Git já preserva histórico.

---

## 22. Formatação e estilo

- Utilizar `dotnet format` como referência de formatação.
- Um tipo público principal por arquivo, salvo tipos auxiliares muito pequenos e fortemente relacionados.
- Nome do arquivo deve corresponder ao tipo principal.
- Preferir `var` quando o tipo for evidente pela expressão; usar tipo explícito quando melhorar a leitura.
- Utilizar `async/await` para I/O.
- Propagar `CancellationToken` em operações assíncronas relevantes.
- Evitar `async void`, exceto manipuladores de eventos exigidos pela plataforma.
- Habilitar nullable reference types.
- Tratar warnings relevantes como problemas a corrigir, não como ruído permanente.

---

## 23. Regras para compactação e abstração

Antes de extrair código compartilhado, verificar:

1. A repetição ocorre em pelo menos dois lugares de forma realmente equivalente?
2. A abstração possui um nome claro no domínio ou na infraestrutura?
3. A extração reduz complexidade para quem lê?
4. As regras específicas continuam visíveis?
5. A abstração é testável?

Não compactar apenas para diminuir LOC.

A regra é:

> **Reutilizar infraestrutura repetitiva; manter explícito o comportamento específico de negócio.**

Exemplos que podem ser compartilhados:

- modais CRUD;
- ações de linha;
- campos comuns;
- formatação;
- paginação;
- feedback visual;
- helpers técnicos;
- validações estruturais realmente comuns.

Exemplos que devem permanecer explícitos quando forem diferentes:

- confirmação/cancelamento de reserva;
- processamento e estorno de pagamento;
- consumo de benefício de convênio;
- eventos de sensor;
- cálculo de tarifa;
- criação específica de vagas;
- regras de variabilidade da LPS.

---

## 24. O que evitar

Evitar deliberadamente:

- arquitetura por `Controllers/Services/Models` para toda a solução;
- `Service` gigante com dezenas de responsabilidades;
- repositório genérico sem necessidade;
- Unit of Work criado apenas para encapsular `DbContext`;
- AutoMapper quando mapeamento manual for pequeno e mais claro;
- MediatR apenas para transformar uma chamada direta em indireta;
- `if` de tenant espalhado pelo sistema;
- regra de negócio em `.razor`;
- acesso ao banco dentro do domínio;
- componentes genéricos excessivamente configuráveis;
- herança apenas para reutilizar poucas linhas;
- classes `Helper` ou `Utils` sem responsabilidade definida;
- `catch` silencioso;
- valores mágicos espalhados pelo código;
- duplicação de enums e estados entre camadas.

---

## 25. Fluxo esperado de uma funcionalidade

Exemplo: criação de veículo.

```text
Veiculos.razor
      │
      ▼
CriarVeiculoComando
      │
      ▼
CriarVeiculoManipulador
      │
      ├── valida tenant/LPS
      ├── cria Veiculo do domínio
      ├── aplica regras de negócio
      │
      ▼
SmartParkDbContext
      │
      ▼
SQLite
```

Exemplo: confirmação de reserva.

```text
Reservas.razor
      │
      ▼
ConfirmarReservaComando
      │
      ▼
ConfirmarReservaManipulador
      │
      ▼
Reserva.Confirmar()
      │
      ├── Observer da Reserva
      └── alteração da Vaga
      │
      ▼
EF Core / transação
      │
      ▼
SQLite
```

---

## 26. Checklist para Pull Request ou commit relevante

Antes de considerar uma alteração concluída:

- [ ] O código está em português e segue o vocabulário oficial?
- [ ] A funcionalidade está na feature correta?
- [ ] Regras de domínio estão fora da interface?
- [ ] Não foi introduzido `if` de tenant desnecessário?
- [ ] A LPS continua centralizada?
- [ ] Não existe duplicação óbvia que deveria ser compartilhada?
- [ ] Não foi criada abstração desnecessária?
- [ ] Operações de banco preservam integridade e isolamento por tenant?
- [ ] Testes foram criados ou atualizados?
- [ ] Testes existentes continuam passando?
- [ ] O projeto compila sem warnings novos relevantes?
- [ ] O código continua fácil de demonstrar academicamente?

---

## 27. Princípios finais do SmartPark

1. **Clareza antes de abstração.**
2. **Domínio independente de tecnologia.**
3. **Organização por funcionalidade.**
4. **Regras de negócio explícitas.**
5. **LPS centralizada e sem condicionais espalhadas.**
6. **Reúso onde existe repetição real.**
7. **CQRS sem burocracia.**
8. **EF Core como detalhe de infraestrutura.**
9. **Blazor responsável pela apresentação, não pelo domínio.**
10. **Código, testes e estrutura devem ser compreensíveis para qualquer integrante da equipe.**

A arquitetura existe para facilitar a evolução do SmartPark. Se uma abstração tornar o sistema mais difícil de entender do que a implementação direta, ela deve ser reconsiderada.
