using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Eventos;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.LinhaDeProduto;
using SmartPark.Dominio.Padroes.Fabrica.Variantes;
using SmartPark.Dominio.Padroes.Observador;
using SmartPark.Dominio.Padroes.Observador.Reservas;

namespace SmartPark.Dominio.Testes.Padroes;

public class ObservadorReservaTestes
{
    private readonly VagaComum _vaga = new(1, "shopping", "A-01", "A");
    private readonly Estacionamento _estacionamento;
    private readonly Reserva _reserva;
    private readonly List<Notificacao> _notificacoes = [];
    private readonly EventosReserva _eventos = new();

    public ObservadorReservaTestes()
    {
        _estacionamento = new Estacionamento(1, "shopping", "Estacionamento Central", "Av. das Palmeiras, 450", vagas: [_vaga]);
        _reserva = new Reserva(1, "shopping", 1, _vaga.Id, new DateOnly(2026, 9, 5), new TimeOnly(18, 30), 2);
        _eventos.Inscrever(new ObservadorVagaReserva(_estacionamento));
        _eventos.Inscrever(new ObservadorNotificacaoReserva(_notificacoes));
    }

    [Fact]
    public void Inscrever_DeveRegistrarOsDoisObservers()
    {
        Assert.Equal(2, _eventos.QuantidadeObservadores());
    }

    [Fact]
    public void Confirmar_DeveReservarVaga_ECriarNotificacao()
    {
        _eventos.Confirmar(_reserva);

        Assert.Equal(StatusReserva.Confirmada, _reserva.Status);
        Assert.Equal(StatusVaga.Reservada, _vaga.Status);
        Assert.Equal("Reserva confirmada para a vaga 1.", _notificacoes[0].Mensagem);
    }

    [Fact]
    public void Cancelar_DeveLiberarVaga_ECriarAlerta()
    {
        _eventos.Confirmar(_reserva);
        _eventos.Cancelar(_reserva);

        Assert.Equal(StatusReserva.Cancelada, _reserva.Status);
        Assert.Equal(StatusVaga.Livre, _vaga.Status);
        Assert.Equal("Reserva cancelada. A vaga 1 foi liberada.", _notificacoes[1].Mensagem);
        Assert.True(_notificacoes[1].EhAlerta());
    }

    [Fact]
    public void Cancelar_NaoDeveLiberarVaga_QuandoVeiculoJaOcupou()
    {
        _eventos.Confirmar(_reserva);
        _vaga.Ocupar();

        _eventos.Cancelar(_reserva);

        Assert.Equal(StatusVaga.Ocupada, _vaga.Status);
    }

    [Fact]
    public void Alterar_DeveNotificar_SemMudarStatusDaVaga()
    {
        _eventos.Confirmar(_reserva);

        _eventos.Alterar(_reserva, new DateOnly(2026, 9, 6), new TimeOnly(10, 0), 4);

        Assert.Equal(StatusVaga.Reservada, _vaga.Status);
        Assert.Equal("Nova data: 2026-09-06 às 10:00, por 4h.", _notificacoes[1].Mensagem);
    }

    [Fact]
    public void Confirmar_DeveEntregarOMesmoEventoATodosOsObservers()
    {
        var eventos = new EventosReserva();
        var observadorA = new ObservadorFalso<EventoReserva>();
        var observadorB = new ObservadorFalso<EventoReserva>();
        eventos.Inscrever(observadorA);
        eventos.Inscrever(observadorB);

        eventos.Confirmar(_reserva);

        Assert.Same(observadorA.Recebidos[0], observadorB.Recebidos[0]);
        Assert.Equal(new EventoReserva(TipoEventoReserva.Confirmada, _reserva), observadorA.Recebidos[0]);
    }

    [Fact]
    public void Cancelar_NaoDeveNotificar_QuandoOperacaoFalha()
    {
        _eventos.Confirmar(_reserva);
        _eventos.Cancelar(_reserva);

        Assert.Contains("não pode ser cancelada", Assert.Throws<RegraDeNegocioException>(() => _eventos.Cancelar(_reserva)).Message);
        Assert.Equal(2, _notificacoes.Count);
    }

    [Fact]
    public void RegistroTenants_DeveTerNotificacoesLigadas_EmTodasAsVariantes()
    {
        Assert.All(RegistroTenants.Todos, tenant => Assert.True(tenant.PossuiRecurso(Recurso.Notificacoes)));
    }

    [Fact]
    public void CriarEventosReserva_DeveRegistrarNotificacao_QuandoRecursoLigado()
    {
        var notificacoes = new List<Notificacao>();
        var eventos = RegistroObservadores.CriarEventosReserva(_estacionamento, new VarianteShopping(), notificacoes);

        eventos.Confirmar(_reserva);

        Assert.Equal(2, eventos.QuantidadeObservadores());
        Assert.Single(notificacoes);
    }

    [Fact]
    public void CriarEventosReserva_DeveRegistrarSoAVaga_QuandoNotificacoesDesligado()
    {
        var notificacoes = new List<Notificacao>();
        var eventos = RegistroObservadores.CriarEventosReserva(_estacionamento, new VarianteSemNotificacoes(), notificacoes);

        eventos.Confirmar(_reserva);

        Assert.Equal(1, eventos.QuantidadeObservadores());
        Assert.Equal(StatusVaga.Reservada, _vaga.Status); // a vaga continua sendo atualizada
        Assert.Empty(notificacoes);
    }
}
