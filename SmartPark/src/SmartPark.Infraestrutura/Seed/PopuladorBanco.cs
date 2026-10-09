using Microsoft.EntityFrameworkCore;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Padroes.Estrategia.Pagamentos;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;
using SmartPark.Dominio.Padroes.Fabrica.Vagas;
using SmartPark.Dominio.Padroes.Fabrica.Variantes;
using SmartPark.Infraestrutura.Persistencia;
using static SmartPark.Dominio.LinhaDeProduto.RegistroTenants;

namespace SmartPark.Infraestrutura.Seed;

/// <summary>
/// Dados de demonstração. Os registros são criados pelas próprias classes do domínio
/// (Factory Method para vagas e tarifas, Strategy para valores), como faria a aplicação.
/// </summary>
public class PopuladorBanco(SmartParkDbContext contexto)
{
    /// <summary>Popula só as tabelas vazias e devolve os nomes das que foram populadas.</summary>
    public async Task<IReadOnlyList<string>> PopularTabelasVaziasAsync(CancellationToken cancellationToken = default)
    {
        var populadas = new List<string>();

        // Ordem de criação: quem aponta para outra tabela (chave estrangeira) vem depois dela.
        await PopularSeVaziaAsync(contexto.Veiculos, PopularVeiculos, populadas, cancellationToken);
        await PopularSeVaziaAsync(contexto.Usuarios, PopularUsuarios, populadas, cancellationToken);
        await PopularSeVaziaAsync(contexto.Vagas, PopularVagas, populadas, cancellationToken);
        await PopularSeVaziaAsync(contexto.Acessos, PopularAcessos, populadas, cancellationToken);
        await PopularSeVaziaAsync(contexto.Tarifas, PopularTarifas, populadas, cancellationToken);
        await PopularSeVaziaAsync(contexto.Reservas, PopularReservasAsync, populadas, cancellationToken);
        await PopularSeVaziaAsync(contexto.Convenios, PopularConvenios, populadas, cancellationToken); // também popula Atendimentos
        await PopularSeVaziaAsync(contexto.Pagamentos, PopularPagamentosAsync, populadas, cancellationToken);
        return populadas;
    }

    /// <summary>Apaga todos os dados, reinicia os ids em 1 e insere novamente os registros de demonstração.</summary>
    public async Task ResetarAsync(CancellationToken cancellationToken = default)
    {
        await using var transacao = await contexto.Database.BeginTransactionAsync(cancellationToken);

        // Ordem inversa da criação: quem tem chave estrangeira é apagado antes da tabela apontada
        await contexto.Pagamentos.ExecuteDeleteAsync(cancellationToken);
        await contexto.Atendimentos.ExecuteDeleteAsync(cancellationToken);
        await contexto.Convenios.ExecuteDeleteAsync(cancellationToken);
        await contexto.Reservas.ExecuteDeleteAsync(cancellationToken);
        await contexto.Tarifas.ExecuteDeleteAsync(cancellationToken);
        await contexto.Acessos.ExecuteDeleteAsync(cancellationToken);
        await contexto.Vagas.ExecuteDeleteAsync(cancellationToken);
        await contexto.Usuarios.ExecuteDeleteAsync(cancellationToken);
        await contexto.Veiculos.ExecuteDeleteAsync(cancellationToken);
        await contexto.Database.ExecuteSqlRawAsync("DELETE FROM sqlite_sequence", cancellationToken);

        contexto.ChangeTracker.Clear();
        await PopularTabelasVaziasAsync(cancellationToken);
        await transacao.CommitAsync(cancellationToken);
    }

    private async Task PopularSeVaziaAsync<T>(DbSet<T> tabela, Func<CancellationToken, Task> popular, List<string> populadas, CancellationToken cancellationToken)
        where T : class
    {
        if (await tabela.AnyAsync(cancellationToken)) return;
        await popular(cancellationToken);
        await contexto.SaveChangesAsync(cancellationToken);
        populadas.Add(contexto.Model.FindEntityType(typeof(T))!.GetTableName()!);
    }

    private Task PopularSeVaziaAsync<T>(DbSet<T> tabela, Action popular, List<string> populadas, CancellationToken cancellationToken)
        where T : class =>
        PopularSeVaziaAsync(tabela, _ => { popular(); return Task.CompletedTask; }, populadas, cancellationToken);

    /// <summary>A mesma placa pode existir em tenants diferentes.</summary>
    private void PopularVeiculos() => contexto.Veiculos.AddRange(
        new Veiculo(0, Shopping, "SPK1A23", "Honda City", "Cinza", "Meu carro"),
        new Veiculo(0, Shopping, "BRA2E19", "Jeep Renegade", "Branco", "Família"),
        new Veiculo(0, Condominio, "SPK1A23", "Honda City", "Cinza", "Meu carro", unidade: "Torre B · 804"),
        new Veiculo(0, Condominio, "RES4B21", "Fiat Pulse", "Vermelho", "Segundo carro", unidade: "Torre B · 804"),
        new Veiculo(0, Hospital, "HSP2C34", "Toyota Corolla", "Preto", "Meu carro"),
        new Veiculo(0, Empresa, "SPK1A23", "Honda City", "Cinza", "Meu carro", tagRfid: "NX-92841"),
        new Veiculo(0, Empresa, "NXR5D67", "Chevrolet Onix", "Branco", "Carro da equipe", tagRfid: "NX-71520"));

    /// <summary>Os tipos de pessoa e perfis seguem o que cada tenant permite.</summary>
    private void PopularUsuarios() => contexto.Usuarios.AddRange(
        new Usuario(0, Shopping, "Marina Costa", "123.456.789-01", Perfil.Motorista, TipoPessoa.Motorista),
        new Usuario(0, Shopping, "Pedro Alves", "234.567.890-12", Perfil.Motorista, TipoPessoa.Motorista, ativo: false),
        new Usuario(0, Shopping, "Rafael Lima", "345.678.901-23", Perfil.Manobrista, TipoPessoa.Funcionario),
        new Usuario(0, Condominio, "Juliana Reis", "456.789.012-34", Perfil.Morador, TipoPessoa.Morador),
        new Usuario(0, Condominio, "Carlos Nunes", "567.890.123-45", Perfil.Visitante, TipoPessoa.Visitante),
        new Usuario(0, Hospital, "Helena Moreira", "678.901.234-56", Perfil.Motorista, TipoPessoa.Paciente),
        new Usuario(0, Hospital, "Beatriz Souza", "789.012.345-67", Perfil.Visitante, TipoPessoa.Acompanhante),
        new Usuario(0, Empresa, "Lucas Martins", "890.123.456-78", Perfil.Funcionario, TipoPessoa.Funcionario),
        new Usuario(0, Empresa, "Diego Ramos", "901.234.567-89", Perfil.Visitante, TipoPessoa.Visitante));

    /// <summary>Os tipos de vaga seguem o TiposVaga de cada tenant.</summary>
    private void PopularVagas() => contexto.Vagas.AddRange(
        CriarVaga(Shopping, "A-01", "A", TipoVaga.Comum),
        CriarVaga(Shopping, "A-02", "A", TipoVaga.PCD, StatusVaga.Ocupada),
        CriarVaga(Shopping, "A-03", "A", TipoVaga.Eletrica, StatusVaga.Reservada),
        CriarVaga(Shopping, "A-04", "A", TipoVaga.Comum, StatusVaga.Bloqueada),
        CriarVaga(Shopping, "B-11", "B", TipoVaga.Comum),
        CriarVaga(Shopping, "B-12", "B", TipoVaga.Comum, StatusVaga.Ocupada),
        CriarVaga(Shopping, "B-13", "B", TipoVaga.Eletrica),
        CriarVaga(Shopping, "B-14", "B", TipoVaga.PCD),
        CriarVaga(Condominio, "T1-101", "Torre 1", TipoVaga.Nominal, StatusVaga.Ocupada),
        CriarVaga(Condominio, "T1-102", "Torre 1", TipoVaga.Nominal),
        CriarVaga(Condominio, "T2-804", "Torre 2", TipoVaga.Nominal, StatusVaga.Ocupada),
        CriarVaga(Condominio, "V-01", "Visitantes", TipoVaga.Comum),
        CriarVaga(Condominio, "V-02", "Visitantes", TipoVaga.PCD, StatusVaga.Bloqueada),
        CriarVaga(Hospital, "P-01", "Pronto-socorro", TipoVaga.Prioritaria, StatusVaga.Ocupada),
        CriarVaga(Hospital, "P-02", "Pronto-socorro", TipoVaga.Prioritaria),
        CriarVaga(Hospital, "P-03", "Pronto-socorro", TipoVaga.PCD),
        CriarVaga(Hospital, "C-10", "Consultórios", TipoVaga.Comum, StatusVaga.Ocupada),
        CriarVaga(Hospital, "C-11", "Consultórios", TipoVaga.Comum, StatusVaga.Bloqueada),
        CriarVaga(Empresa, "D-01", "Diretoria", TipoVaga.Restrita, StatusVaga.Ocupada),
        CriarVaga(Empresa, "D-02", "Diretoria", TipoVaga.Restrita),
        CriarVaga(Empresa, "G-01", "Garagem", TipoVaga.Eletrica, StatusVaga.Ocupada),
        CriarVaga(Empresa, "G-02", "Garagem", TipoVaga.Comum),
        CriarVaga(Empresa, "G-03", "Garagem", TipoVaga.PCD));

    /// <summary>Os acessos são sempre "de hoje" e o identificador segue o MetodoAcesso de cada tenant.</summary>
    private void PopularAcessos() => contexto.Acessos.AddRange(
        CriarAcesso(Shopping, "Marina Costa", "BRA2E19", DirecaoAcesso.Entrada, StatusAcesso.Liberado, HojeAs(14, 32)),
        CriarAcesso(Shopping, "Rafael Lima", "GHT7A42", DirecaoAcesso.Saida, StatusAcesso.Liberado, HojeAs(14, 18)),
        CriarAcesso(Shopping, "Bruno Dias", "DFK4J86", DirecaoAcesso.Entrada, StatusAcesso.Pendente, HojeAs(13, 54)),
        CriarAcesso(Shopping, "Carlos Nunes", "SPK1A23", DirecaoAcesso.Entrada, StatusAcesso.Negado, HojeAs(13, 41), motivo: "Placa sem cadastro"),
        CriarAcesso(Shopping, "Paula Mendes", "FGH3J21", DirecaoAcesso.Entrada, StatusAcesso.Liberado, HojeAs(12, 10), manual: true),
        CriarAcesso(Condominio, "Juliana Reis", "QR-4839-221", DirecaoAcesso.Entrada, StatusAcesso.Liberado, HojeAs(14, 5)),
        CriarAcesso(Condominio, "Carlos Nunes", "QR-9912-118", DirecaoAcesso.Entrada, StatusAcesso.Pendente, HojeAs(13, 50)),
        CriarAcesso(Condominio, "Entrega Rápida", "QR-1157-620", DirecaoAcesso.Saida, StatusAcesso.Liberado, HojeAs(12, 30), manual: true),
        CriarAcesso(Condominio, "Visitante não identificado", "QR-0000-000", DirecaoAcesso.Entrada, StatusAcesso.Negado, HojeAs(11, 15), motivo: "QR Code expirado"),
        CriarAcesso(Hospital, "Helena Moreira", "HSP2C34", DirecaoAcesso.Entrada, StatusAcesso.Liberado, HojeAs(14, 40)),
        CriarAcesso(Hospital, "Beatriz Souza", "QWE1A23", DirecaoAcesso.Entrada, StatusAcesso.Pendente, HojeAs(14, 12)),
        CriarAcesso(Hospital, "Roberto Alves", "RTY4B56", DirecaoAcesso.Saida, StatusAcesso.Liberado, HojeAs(13, 2), manual: true),
        CriarAcesso(Hospital, "João Lima", "JKL7M89", DirecaoAcesso.Entrada, StatusAcesso.Negado, HojeAs(12, 45), motivo: "Vagas de visitante lotadas"),
        CriarAcesso(Empresa, "Lucas Martins", "RF-10982", DirecaoAcesso.Entrada, StatusAcesso.Liberado, HojeAs(8, 55)),
        CriarAcesso(Empresa, "Fernanda Rocha", "RF-28473", DirecaoAcesso.Saida, StatusAcesso.Liberado, HojeAs(12, 2)),
        CriarAcesso(Empresa, "Diego Ramos", "RF-67011", DirecaoAcesso.Entrada, StatusAcesso.Pendente, HojeAs(13, 20)),
        CriarAcesso(Empresa, "Ex-colaborador", "RF-44310", DirecaoAcesso.Entrada, StatusAcesso.Negado, HojeAs(9, 10), motivo: "Tag desativada"),
        CriarAcesso(Empresa, "Técnico de manutenção", "RF-VISITA-01", DirecaoAcesso.Entrada, StatusAcesso.Liberado, HojeAs(10, 30), manual: true));

    /// <summary>
    /// A tarifa ativa de cada tenant com Cobranca vem do Factory Method da variante;
    /// as inativas existem para demonstrar a troca de Strategy.
    /// </summary>
    private void PopularTarifas()
    {
        foreach (var tenant in Todos.Where(tenant => tenant.PossuiRecurso(Recurso.Cobranca)))
        {
            var tarifaPadrao = VariantePorTenant.Obter(tenant.Identificador).CriarTarifa(0);
            tarifaPadrao.Ativar();
            contexto.Tarifas.Add(tarifaPadrao);
        }
        contexto.Tarifas.AddRange(
            new Tarifa(0, Shopping, "Diária promocional", new TarifaFixaDiaria(40)),
            new Tarifa(0, Shopping, "Cortesia para lojistas", new TarifaIsenta()),
            new Tarifa(0, Hospital, "Diária de acompanhante", new TarifaFixaDiaria(30)));
    }

    /// <summary>Só no Shopping (único tenant com Reserva). A confirmada usa a vaga A-03, já Reservada.</summary>
    private async Task PopularReservasAsync(CancellationToken cancellationToken)
    {
        var veiculo = await BuscarVeiculoAsync(Shopping, "BRA2E19", cancellationToken);
        var tarifa = VariantePorTenant.Obter(Shopping).CriarTarifa(0);
        var hoje = DateOnly.FromDateTime(DateTime.Today);

        async Task AdicionarAsync(string codigoVaga, int dias, TimeOnly hora, int duracaoHoras, StatusReserva status)
        {
            var vaga = await contexto.Vagas.SingleAsync(item => item.TenantId == Shopping && item.Codigo == codigoVaga, cancellationToken);
            var reserva = new Reserva(0, Shopping, veiculo.Id, vaga.Id, hoje.AddDays(dias), hora, duracaoHoras, status);
            // A estimativa passa por Reserva → Tarifa → Strategy, como na aplicação
            reserva.CalcularEstimativa(tarifa);
            contexto.Reservas.Add(reserva);
        }

        await AdicionarAsync("A-03", 2, new TimeOnly(18, 30), 2, StatusReserva.Confirmada);
        await AdicionarAsync("B-11", 1, new TimeOnly(10, 0), 4, StatusReserva.Cancelada);
        await AdicionarAsync("B-14", -3, new TimeOnly(14, 0), 1, StatusReserva.Concluida);
    }

    /// <summary>Convênios e atendimentos, só em tenants com ConvenioMedico. As datas são relativas a agora (janela de 24h).</summary>
    private void PopularConvenios()
    {
        if (!Obter(Hospital).PossuiRecurso(Recurso.ConvenioMedico)) return;

        var saudePlena = new Convenio(0, Hospital, "Saúde Plena", TipoBeneficio.Isencao);
        var vidaCare = new Convenio(0, Hospital, "VidaCare", TipoBeneficio.Percentual, 50);
        var bemEstar = new Convenio(0, Hospital, "Bem Estar", TipoBeneficio.HorasGratis, 2);
        var planoAntigo = new Convenio(0, Hospital, "Plano Antigo", TipoBeneficio.Percentual, 30, ativo: false);
        var medSul = new Convenio(0, Hospital, "MedSul", TipoBeneficio.HorasGratis, 1); // sem atendimentos: pode ser excluído
        contexto.Convenios.AddRange(saudePlena, vidaCare, bemEstar, planoAntigo, medSul);

        contexto.Atendimentos.AddRange(
            new Atendimento(0, Hospital, "ATD-48291", "Helena Moreira", saudePlena, HorasAtras(2)), // elegível
            new Atendimento(0, Hospital, "ATD-71305", "Roberto Alves", vidaCare, HorasAtras(5)), // elegível
            new Atendimento(0, Hospital, "ATD-10928", "Beatriz Souza", bemEstar, HorasAtras(1)), // elegível
            new Atendimento(0, Hospital, "ATD-55120", "João Lima", planoAntigo, HorasAtras(3)), // convênio inativo
            new Atendimento(0, Hospital, "ATD-30017", "Marta Dias", vidaCare, HorasAtras(72)), // mais de 24h
            new Atendimento(0, Hospital, "ATD-90442", "Paulo Reis", saudePlena, HorasAtras(4), beneficioAplicado: true)); // já usado
    }

    /// <summary>
    /// Só em tenants com Cobranca, pelo mesmo caminho da aplicação:
    /// Tarifa (Factory Method da variante) → [TarifaComConvenio] → Pagamento (Strategy).
    /// O pagamento de atendimento usa o ATD-90442, que já está com o benefício aplicado.
    /// </summary>
    private async Task PopularPagamentosAsync(CancellationToken cancellationToken)
    {
        async Task AdicionarAsync(string tenant, string placa, int duracaoHoras, IEstrategiaPagamento estrategia, int horasAtras,
            bool estornado = false, string? codigoVagaDaReserva = null, string? numeroAtendimento = null)
        {
            if (!Obter(tenant).PossuiRecurso(Recurso.Cobranca)) return;

            var veiculo = await BuscarVeiculoAsync(tenant, placa, cancellationToken);
            var reserva = codigoVagaDaReserva is null ? null : await contexto.Reservas
                .Where(item => item.TenantId == tenant)
                .Join(contexto.Vagas.Where(vaga => vaga.Codigo == codigoVagaDaReserva), item => item.VagaId, vaga => vaga.Id, (item, _) => item)
                .SingleAsync(cancellationToken);
            var atendimento = numeroAtendimento is null ? null : await contexto.Atendimentos.Include(item => item.Convenio)
                .SingleAsync(item => item.TenantId == tenant && item.Numero == numeroAtendimento, cancellationToken);

            var variante = VariantePorTenant.Obter(tenant);
            var valorTarifa = variante.CriarTarifa(0).Calcular(duracaoHoras);
            var valor = variante.CriarTarifa(0, atendimento?.Convenio).Calcular(duracaoHoras);

            var pagamento = new Pagamento(0, tenant, veiculo.Id, duracaoHoras, valorTarifa, valor, estrategia,
                reserva?.Id, atendimento?.Id, criadoEm: HorasAtras(horasAtras));
            pagamento.Pagar();
            if (estornado) pagamento.Estornar();
            contexto.Pagamentos.Add(pagamento);
        }

        await AdicionarAsync(Shopping, "BRA2E19", 2, new PagamentoPix(), horasAtras: 26);
        await AdicionarAsync(Shopping, "BRA2E19", 4, new PagamentoCredito(3), horasAtras: 5); // 5% de taxa
        await AdicionarAsync(Shopping, "BRA2E19", 4, new PagamentoDebito(), horasAtras: 30, estornado: true, codigoVagaDaReserva: "B-11"); // reserva cancelada
        await AdicionarAsync(Hospital, "HSP2C34", 3, new PagamentoPix(), horasAtras: 6);
        await AdicionarAsync(Hospital, "HSP2C34", 2, new PagamentoDebito(), horasAtras: 4, numeroAtendimento: "ATD-90442");
    }

    private Task<Veiculo> BuscarVeiculoAsync(string tenant, string placa, CancellationToken cancellationToken) =>
        contexto.Veiculos.SingleAsync(veiculo => veiculo.TenantId == tenant && veiculo.Placa == placa, cancellationToken);

    /// <summary>A vaga nasce pelo Factory Method e chega ao status pelos métodos da própria Vaga.</summary>
    private static Vaga CriarVaga(string tenant, string codigo, string setor, TipoVaga tipo, StatusVaga status = StatusVaga.Livre)
    {
        var vaga = CriadorVagaPorTipo.Obter(tipo).CriarVaga(0, tenant, codigo, setor);
        if (status == StatusVaga.Ocupada) vaga.Ocupar();
        if (status == StatusVaga.Reservada) vaga.Reservar();
        if (status == StatusVaga.Bloqueada) vaga.Bloquear();
        return vaga;
    }

    /// <summary>O acesso nasce Pendente e é decidido pelos métodos Liberar/Negar.</summary>
    private static Acesso CriarAcesso(string tenant, string pessoa, string identificador, DirecaoAcesso direcao, StatusAcesso status,
        DateTime horario, bool manual = false, string motivo = "")
    {
        var acesso = new Acesso(0, tenant, pessoa, identificador, Obter(tenant).MetodoAcesso, direcao, manual, horario);
        if (status == StatusAcesso.Liberado) acesso.Liberar();
        if (status == StatusAcesso.Negado) acesso.Negar(motivo);
        return acesso;
    }

    private static DateTime HojeAs(int hora, int minuto) => DateTime.Today.AddHours(hora).AddMinutes(minuto);

    private static DateTime HorasAtras(int horas) => DateTime.Now.AddHours(-horas);
}
