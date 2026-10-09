using Microsoft.EntityFrameworkCore;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Padroes.Estrategia.Pagamentos;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Integracao.Testes;

/// <summary>As regras de integridade continuam no banco mesmo quando a aplicação também valida.</summary>
public sealed class RestricoesBancoTestes : IDisposable
{
    private readonly BancoDeTeste _banco = new();

    public void Dispose() => _banco.Dispose();

    private async Task GravarAsync(params object[] entidades)
    {
        await using var contexto = _banco.CriarContexto();
        contexto.AddRange(entidades);
        await contexto.SaveChangesAsync();
    }

    private static Veiculo NovoVeiculo(string tenant = "shopping", string placa = "BRA2E19") => new(0, tenant, placa, "Jeep Renegade", "Branco", "Família");

    [Fact]
    public async Task Veiculo_DeveRecusarPlacaRepetida_NoMesmoTenant()
    {
        await GravarAsync(NovoVeiculo(), NovoVeiculo("company"));

        await Assert.ThrowsAsync<DbUpdateException>(() => GravarAsync(NovoVeiculo()));
    }

    [Fact]
    public async Task Veiculo_DeveRecusarTenantDesconhecido()
    {
        await Assert.ThrowsAsync<DbUpdateException>(() => GravarAsync(NovoVeiculo("aeroporto")));
    }

    [Fact]
    public async Task Tarifa_DeveRecusarSegundaTarifaAtiva_NoMesmoTenant()
    {
        await GravarAsync(
            new Tarifa(0, "shopping", "Padrão", new TarifaPorHora(12), ativa: true),
            new Tarifa(0, "shopping", "Diária", new TarifaFixaDiaria(40)),
            new Tarifa(0, "hospital", "Padrão", new TarifaPorHora(10), ativa: true));

        await Assert.ThrowsAsync<DbUpdateException>(() => GravarAsync(new Tarifa(0, "shopping", "Outra", new TarifaIsenta(), ativa: true)));
    }

    [Fact]
    public async Task Reserva_DeveRecusarDuasConfirmadas_NaMesmaVaga()
    {
        var veiculo = NovoVeiculo();
        var vaga = new VagaComum(0, "shopping", "A-01", "A");
        await GravarAsync(veiculo, vaga);
        Reserva NovaReserva(StatusReserva status) => new(0, "shopping", veiculo.Id, vaga.Id, new DateOnly(2026, 10, 10), new TimeOnly(10, 0), 2, status);
        await GravarAsync(NovaReserva(StatusReserva.Confirmada), NovaReserva(StatusReserva.Cancelada));

        await Assert.ThrowsAsync<DbUpdateException>(() => GravarAsync(NovaReserva(StatusReserva.Confirmada)));
    }

    [Fact]
    public async Task Pagamento_DeveRecusarSegundoPagamento_DoMesmoAtendimento()
    {
        var veiculo = NovoVeiculo("hospital", "HSP2C34");
        var atendimento = new Atendimento(0, "hospital", "ATD-48291", "Helena Moreira", new Convenio(0, "hospital", "Saúde Plena", TipoBeneficio.Isencao), DateTime.Now);
        await GravarAsync(veiculo, atendimento);
        Pagamento NovoPagamento() => new(0, "hospital", veiculo.Id, 2, 20, 0, new PagamentoPix(), atendimentoId: atendimento.Id);
        await GravarAsync(NovoPagamento());

        await Assert.ThrowsAsync<DbUpdateException>(() => GravarAsync(NovoPagamento()));
    }

    [Fact]
    public async Task Vaga_NaoDeveSerExcluida_QuandoTemReserva()
    {
        var veiculo = NovoVeiculo();
        var vaga = new VagaComum(0, "shopping", "A-01", "A");
        await GravarAsync(veiculo, vaga);
        await GravarAsync(new Reserva(0, "shopping", veiculo.Id, vaga.Id, new DateOnly(2026, 10, 10), new TimeOnly(10, 0), 2));

        await using var contexto = _banco.CriarContexto();
        await Assert.ThrowsAsync<DbUpdateException>(async () =>
        {
            contexto.Vagas.Remove(await contexto.Vagas.SingleAsync());
            await contexto.SaveChangesAsync();
        });
    }

    [Fact]
    public async Task Migracao_DeveCriarAsNoveTabelas()
    {
        await using var contexto = _banco.CriarContexto();

        var tabelas = await contexto.Database
            .SqlQueryRaw<string>("SELECT name AS Value FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__EF%' ORDER BY name")
            .ToListAsync();

        Assert.Equal(["Acessos", "Atendimentos", "Convenios", "Pagamentos", "Reservas", "Tarifas", "Usuarios", "Vagas", "Veiculos"], tabelas);
    }
}
