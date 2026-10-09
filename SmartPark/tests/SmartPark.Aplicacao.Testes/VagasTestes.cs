using SmartPark.Aplicacao.Vagas;
using SmartPark.Aplicacao.Vagas.Atualizar;
using SmartPark.Aplicacao.Vagas.Criar;
using SmartPark.Aplicacao.Vagas.Excluir;
using SmartPark.Aplicacao.Vagas.SimularSensor;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Testes;

public class VagasTestes : CenarioAplicacao
{
    [Fact]
    public async Task CriarAsync_DeveUsarOCreatorDoTipo()
    {
        var criada = Sucesso(await new CriarVagaManipulador(Contexto).ExecutarAsync(new("shopping", new DadosVaga("c-30", "C", TipoVaga.Eletrica))));

        Assert.Equal("C-30", criada.Codigo);
        Assert.Equal("Exclusiva para veículos elétricos em recarga", criada.Requisito);
        await using var leitura = CriarContexto();
        Assert.IsType<VagaEletrica>(leitura.Vagas.Single(vaga => vaga.Id == criada.Id));
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoTipoNaoPermitidoNoTenant()
    {
        var erro = Falha(await new CriarVagaManipulador(Contexto).ExecutarAsync(new("shopping", new DadosVaga("N-01", "N", TipoVaga.Nominal))));

        Assert.Equal("Tipo de vaga não permitido em Shopping Center Aurora. Use: Comum, PCD, Elétrica.", erro);
    }

    [Fact]
    public async Task AtualizarAsync_DeveRespeitarRegrasDaVaga_AoMudarStatus()
    {
        var ocupada = IdVaga("shopping", "A-02");

        var erro = Falha(await new AtualizarVagaManipulador(Contexto).ExecutarAsync(new("shopping", ocupada, new DadosVaga("A-02", "A", TipoVaga.PCD, StatusVaga.Bloqueada))));

        Assert.Equal("A vaga A-02 está ocupada e não pode ser bloqueada.", erro);
    }

    [Fact]
    public async Task AtualizarAsync_DeveFalhar_QuandoTentaTrocarOTipo()
    {
        var erro = Falha(await new AtualizarVagaManipulador(Contexto).ExecutarAsync(new("shopping", IdVaga("shopping", "A-01"), new DadosVaga("A-01", "A", TipoVaga.PCD))));

        Assert.StartsWith("O tipo da vaga não pode ser alterado.", erro);
    }

    [Fact]
    public async Task ExcluirAsync_DeveFalhar_QuandoVagaOcupada()
    {
        var erro = Falha(await new ExcluirVagaManipulador(Contexto).ExecutarAsync(new("shopping", IdVaga("shopping", "A-02"))));

        Assert.Equal("A vaga A-02 está Ocupada e não pode ser excluída. Libere ou bloqueie a vaga antes.", erro);
    }

    [Fact]
    public async Task SimularSensorAsync_DeveOcuparVaga_EGerarNotificacao()
    {
        var resultado = Sucesso(await new SimularSensorManipulador(Contexto).ExecutarAsync(new("shopping", IdVaga("shopping", "B-13"), TipoEventoSensor.Ocupada)));

        Assert.Equal(StatusVaga.Ocupada, resultado.Vaga.Status);
        Assert.Contains("Vaga ocupada: O sensor SN-B-13", Assert.Single(resultado.Notificacoes));
        await using var leitura = CriarContexto();
        Assert.Equal(StatusVaga.Ocupada, leitura.Vagas.Single(vaga => vaga.Codigo == "B-13" && vaga.TenantId == "shopping").Status);
    }

    [Fact]
    public async Task SimularSensorAsync_DeveFalhar_QuandoLeituraNaoMudaOEstado()
    {
        var erro = Falha(await new SimularSensorManipulador(Contexto).ExecutarAsync(new("shopping", IdVaga("shopping", "A-02"), TipoEventoSensor.Ocupada)));

        Assert.Equal("O sensor já indica a vaga A-02 como ocupada.", erro);
    }

    [Fact]
    public async Task SimularSensorAsync_DeveFalhar_QuandoVagaBloqueada()
    {
        var erro = Falha(await new SimularSensorManipulador(Contexto).ExecutarAsync(new("shopping", IdVaga("shopping", "A-04"), TipoEventoSensor.Ocupada)));

        Assert.Contains("não pode ser ocupada", erro);
    }
}
