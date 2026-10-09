using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Dominio.Testes.Entidades;

public class ReservaTestes
{
    private static readonly Tarifa TarifaPadrao = new(1, "shopping", "Padrão", new TarifaPorHora(12));

    private static Reserva CriarReserva(StatusReserva status = StatusReserva.Pendente) =>
        new(1, "shopping", 1, 3, new DateOnly(2026, 9, 5), new TimeOnly(18, 30), 2, status);

    [Fact]
    public void CalcularEstimativa_DeveUsarATarifa()
    {
        var reserva = CriarReserva();

        Assert.Equal(24, reserva.CalcularEstimativa(TarifaPadrao));
        Assert.Equal(24, reserva.ValorEstimado);
    }

    [Fact]
    public void Cancelar_DeveEncerrarReserva_DepoisDeConfirmarEAlterar()
    {
        var reserva = CriarReserva();

        reserva.Confirmar();
        Assert.Equal(StatusReserva.Confirmada, reserva.Status);

        reserva.Alterar(new DateOnly(2026, 9, 6), new TimeOnly(10, 0), 4);
        Assert.Equal(4, reserva.DuracaoHoras);

        reserva.Cancelar();
        Assert.False(reserva.EstaAtiva());
        Assert.Contains("Apenas reservas", Assert.Throws<RegraDeNegocioException>(() => reserva.Alterar(new DateOnly(2026, 9, 7), new TimeOnly(10, 0), 1)).Message);
        Assert.Contains("não pode ser cancelada", Assert.Throws<RegraDeNegocioException>(reserva.Cancelar).Message);
    }

    [Fact]
    public void Alterar_DeveFalhar_QuandoDuracaoNaoForPositiva()
    {
        var reserva = CriarReserva();

        var erro = Assert.Throws<RegraDeNegocioException>(() => reserva.Alterar(reserva.Data, reserva.Hora, 0));
        Assert.Contains("maior que zero", erro.Message);
    }

    [Fact]
    public void Expirou_DeveSerVerdadeiro_SomenteDepoisDaToleranciaDe15Minutos()
    {
        var reserva = CriarReserva(StatusReserva.Confirmada);

        Assert.False(reserva.Expirou(new DateTime(2026, 9, 5, 18, 44, 0)));
        Assert.True(reserva.Expirou(new DateTime(2026, 9, 5, 18, 46, 0)));
    }
}
