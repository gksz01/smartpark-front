using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Eventos;
using SmartPark.Dominio.Padroes.Fabrica.Variantes;
using SmartPark.Dominio.Padroes.Observador;
using SmartPark.Dominio.Padroes.Observador.Sensores;

namespace SmartPark.Dominio.Testes.Padroes;

public class ObservadorSensorTestes
{
    private readonly VagaComum _vaga = new(1, "shopping", "A-01", "A");
    private readonly Sensor _sensor;
    private readonly List<Notificacao> _notificacoes = [];
    private readonly ObservadorVagaSensor _observadorVaga;
    private readonly ObservadorNotificacaoSensor _observadorNotificacao;

    public ObservadorSensorTestes()
    {
        _sensor = new Sensor(1, "SN-A01", _vaga.Id);
        _observadorVaga = new ObservadorVagaSensor(_vaga);
        _observadorNotificacao = new ObservadorNotificacaoSensor(_notificacoes);
    }

    private void InscreverOsDois()
    {
        _sensor.Inscrever(_observadorVaga);
        _sensor.Inscrever(_observadorNotificacao);
    }

    [Fact]
    public void Inscrever_DeveIgnorarInscricaoRepetida()
    {
        Assert.Equal(0, _sensor.QuantidadeObservadores());

        InscreverOsDois();
        _sensor.Inscrever(_observadorVaga);

        Assert.Equal(2, _sensor.QuantidadeObservadores());
    }

    [Fact]
    public void DetectarOcupacao_DeveOcuparVaga_EGerarNotificacao()
    {
        InscreverOsDois();

        _sensor.DetectarOcupacao(new DateTime(2026, 9, 5, 14, 32, 0));

        Assert.Equal(StatusVaga.Ocupada, _vaga.Status);
        var notificacao = Assert.Single(_notificacoes);
        Assert.Equal("[14:32] Vaga ocupada: O sensor SN-A01 detectou um veículo na vaga 1.", notificacao.Formatar());
    }

    [Fact]
    public void DetectarLiberacao_DeveLiberarVaga_EGerarOutraNotificacao()
    {
        InscreverOsDois();

        _sensor.DetectarOcupacao();
        _sensor.DetectarLiberacao();

        Assert.Equal(StatusVaga.Livre, _vaga.Status);
        Assert.Equal(["Vaga ocupada", "Vaga liberada"], _notificacoes.Select(notificacao => notificacao.Titulo));
    }

    [Fact]
    public void DetectarOcupacao_NaoDeveNotificar_QuandoEstadoNaoMuda()
    {
        _sensor.Inscrever(_observadorNotificacao);

        _sensor.DetectarOcupacao();
        _sensor.DetectarOcupacao();

        Assert.Single(_notificacoes);
    }

    [Fact]
    public void Desinscrever_DevePararDeEntregarEventos()
    {
        InscreverOsDois();
        _sensor.DetectarOcupacao();

        _sensor.Desinscrever(_observadorNotificacao);
        _sensor.DetectarLiberacao();

        Assert.Equal(StatusVaga.Livre, _vaga.Status); // o observer da vaga continua inscrito
        Assert.Single(_notificacoes); // só a notificação de antes da desinscrição
        Assert.Equal(1, _sensor.QuantidadeObservadores());
    }

    [Fact]
    public void Inscrever_DeveAceitarQualquerIObservador()
    {
        var painel = new ObservadorFalso<EventoSensor>();
        _sensor.Inscrever(painel);

        _sensor.DetectarOcupacao();
        _sensor.DetectarLiberacao();

        Assert.Equal([TipoEventoSensor.Ocupada, TipoEventoSensor.Liberada], painel.Recebidos.Select(evento => evento.Tipo));
    }

    [Fact]
    public void RegistrarObservadoresSensor_DeveRespeitarORecursoNotificacoes()
    {
        var ligado = new Sensor(1, "SN-A01", _vaga.Id);
        var desligado = new Sensor(2, "SN-A02", _vaga.Id);

        RegistroObservadores.RegistrarObservadoresSensor(ligado, _vaga, new VarianteShopping(), []);
        RegistroObservadores.RegistrarObservadoresSensor(desligado, _vaga, new VarianteSemNotificacoes(), []);

        Assert.Equal(2, ligado.QuantidadeObservadores());
        Assert.Equal(1, desligado.QuantidadeObservadores());
    }
}
