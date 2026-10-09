using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Eventos;

namespace SmartPark.Dominio.Padroes.Observador.Reservas;

/// <summary>
/// Observer concreto das reservas: atualiza o status da vaga reservada.
/// Recebe o Estacionamento porque uma reserva pode ser feita para qualquer uma das suas vagas.
/// </summary>
public class ObservadorVagaReserva(Estacionamento estacionamento) : IObservador<EventoReserva>
{
    public void Atualizar(EventoReserva evento)
    {
        var vaga = estacionamento.Vagas.FirstOrDefault(item => item.Id == evento.Reserva.VagaId);
        if (vaga is null) return;

        if (evento.Tipo == TipoEventoReserva.Confirmada) vaga.Reservar();
        // Só libera se a vaga ainda estiver reservada (o veículo pode já ter entrado).
        if (evento.Tipo == TipoEventoReserva.Cancelada && vaga.Status == StatusVaga.Reservada) vaga.Liberar();
    }
}
