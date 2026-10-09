using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Eventos;

namespace SmartPark.Dominio.Padroes.Observador.Reservas;

/// <summary>
/// OBSERVER — Exemplo 2: Subject dos eventos de reserva.
/// Executa a operação na Reserva e, só se ela der certo, avisa os observadores.
/// A Reserva continua sem conhecer nenhum observador.
/// </summary>
public class EventosReserva : Observavel<EventoReserva>
{
    public void Confirmar(Reserva reserva)
    {
        reserva.Confirmar();
        Notificar(new EventoReserva(TipoEventoReserva.Confirmada, reserva));
    }

    public void Alterar(Reserva reserva, DateOnly data, TimeOnly hora, int duracaoHoras)
    {
        reserva.Alterar(data, hora, duracaoHoras);
        Notificar(new EventoReserva(TipoEventoReserva.Alterada, reserva));
    }

    public void Cancelar(Reserva reserva)
    {
        reserva.Cancelar();
        Notificar(new EventoReserva(TipoEventoReserva.Cancelada, reserva));
    }
}
