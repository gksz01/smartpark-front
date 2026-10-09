using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Eventos;

namespace SmartPark.Dominio.Padroes.Observador.Sensores;

/// <summary>Observer concreto do Sensor: registra uma Notificacao para cada mudança de ocupação.</summary>
public class ObservadorNotificacaoSensor(List<Notificacao> notificacoes) : IObservador<EventoSensor>
{
    public void Atualizar(EventoSensor evento)
    {
        var id = notificacoes.Count + 1;
        notificacoes.Add(evento.Tipo == TipoEventoSensor.Ocupada
            ? new Notificacao(id, "Vaga ocupada", $"O sensor {evento.CodigoSensor} detectou um veículo na vaga {evento.VagaId}.", TipoNotificacao.Info, evento.Momento)
            : new Notificacao(id, "Vaga liberada", $"A vaga {evento.VagaId} está livre novamente.", TipoNotificacao.Sucesso, evento.Momento));
    }
}
