using SmartPark.Dominio.Comum;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Eventos;

namespace SmartPark.Dominio.Padroes.Observador.Reservas;

/// <summary>Observer concreto das reservas: registra uma Notificacao para cada acontecimento.</summary>
public class ObservadorNotificacaoReserva(List<Notificacao> notificacoes) : IObservador<EventoReserva>
{
    public void Atualizar(EventoReserva evento)
    {
        var id = notificacoes.Count + 1;
        var reserva = evento.Reserva;
        notificacoes.Add(evento.Tipo switch
        {
            TipoEventoReserva.Confirmada => new Notificacao(id, "Reserva confirmada", $"Reserva confirmada para a vaga {reserva.VagaId}.", TipoNotificacao.Sucesso),
            TipoEventoReserva.Alterada => new Notificacao(id, "Reserva alterada", $"Nova data: {Formatacao.FormatarDataIso(reserva.Data)} às {Formatacao.FormatarHora(reserva.Hora)}, por {reserva.DuracaoHoras}h.", TipoNotificacao.Info),
            _ => new Notificacao(id, "Reserva cancelada", $"Reserva cancelada. A vaga {reserva.VagaId} foi liberada.", TipoNotificacao.Alerta),
        });
    }
}
