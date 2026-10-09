using SmartPark.Aplicacao.Reservas.Cancelar;
using SmartPark.Aplicacao.Reservas.Criar;
using SmartPark.Aplicacao.Reservas.Excluir;
using SmartPark.Aplicacao.Reservas.Listar;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Testes;

public class ReservasTestes : CenarioAplicacao
{
    private static readonly DateOnly Amanha = DateOnly.FromDateTime(DateTime.Today.AddDays(1));

    [Fact]
    public async Task CriarAsync_DeveCalcularEstimativa_EReservarAVagaPeloObserver()
    {
        var comando = new CriarReservaComando("shopping", IdVeiculo("shopping", "SPK1A23"), IdVaga("shopping", "B-13"), Amanha, new TimeOnly(9, 0), 2);

        var resultado = Sucesso(await new CriarReservaManipulador(Contexto).ExecutarAsync(comando));

        Assert.Equal(StatusReserva.Confirmada, resultado.Reserva.Status);
        Assert.Equal(24, resultado.Reserva.ValorEstimado); // 2h × R$ 12 (TarifaPorHora ativa)
        Assert.Equal($"Reserva confirmada para a vaga {comando.VagaId}.", Assert.Single(resultado.Notificacoes));
        await using var leitura = CriarContexto();
        Assert.Equal(StatusVaga.Reservada, leitura.Vagas.Single(vaga => vaga.Id == comando.VagaId).Status);
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoVagaNaoEstaLivre()
    {
        var comando = new CriarReservaComando("shopping", IdVeiculo("shopping", "SPK1A23"), IdVaga("shopping", "A-02"), Amanha, new TimeOnly(9, 0), 2);

        Assert.Equal("A vaga A-02 não está livre para reserva (status: Ocupada).", Falha(await new CriarReservaManipulador(Contexto).ExecutarAsync(comando)));
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoTenantNaoTemReserva()
    {
        var comando = new CriarReservaComando("hospital", IdVeiculo("hospital", "HSP2C34"), IdVaga("hospital", "P-02"), Amanha, new TimeOnly(9, 0), 2);

        Assert.Equal("O módulo Reserva não está disponível para Hospital Santa Clara.", Falha(await new CriarReservaManipulador(Contexto).ExecutarAsync(comando)));
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoDuracaoForaDoLimite()
    {
        var comando = new CriarReservaComando("shopping", IdVeiculo("shopping", "SPK1A23"), IdVaga("shopping", "B-13"), Amanha, new TimeOnly(9, 0), 25);

        Assert.Equal("A duração deve ser um número inteiro de 1 a 24 horas.", Falha(await new CriarReservaManipulador(Contexto).ExecutarAsync(comando)));
    }

    [Fact]
    public async Task CancelarAsync_DeveLiberarAVaga_EPermitirExcluir()
    {
        var reservas = Sucesso(await new ListarReservasManipulador(Contexto).ExecutarAsync(new("shopping")));
        var confirmada = Assert.Single(reservas, reserva => reserva.Status == StatusReserva.Confirmada);
        Assert.Equal("Cancele a reserva antes de excluir.", Falha(await new ExcluirReservaManipulador(Contexto).ExecutarAsync(new("shopping", confirmada.Id))));

        var cancelada = Sucesso(await new CancelarReservaManipulador(Contexto).ExecutarAsync(new("shopping", confirmada.Id)));

        Assert.Equal(StatusReserva.Cancelada, cancelada.Reserva.Status);
        await using (var leitura = CriarContexto())
            Assert.Equal(StatusVaga.Livre, leitura.Vagas.Single(vaga => vaga.Id == confirmada.VagaId).Status);
        Sucesso(await new ExcluirReservaManipulador(Contexto).ExecutarAsync(new("shopping", confirmada.Id)));
    }

    [Fact]
    public async Task ExcluirAsync_DeveFalhar_QuandoReservaTemPagamento()
    {
        var comPagamento = Contexto.Pagamentos.Single(pagamento => pagamento.ReservaId != null).ReservaId!.Value;

        var erro = Falha(await new ExcluirReservaManipulador(Contexto).ExecutarAsync(new("shopping", comPagamento)));

        Assert.Equal("Esta reserva possui pagamento registrado. Exclua o pagamento antes.", erro);
    }
}
