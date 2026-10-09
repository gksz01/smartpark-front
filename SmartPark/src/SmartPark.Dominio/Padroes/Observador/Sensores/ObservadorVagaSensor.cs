using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Eventos;

namespace SmartPark.Dominio.Padroes.Observador.Sensores;

/// <summary>
/// Observer concreto do Sensor: mantém o status da Vaga igual ao que o sensor detectou.
/// Recebe uma única vaga porque o sensor fica instalado fisicamente nela.
/// </summary>
public class ObservadorVagaSensor(Vaga vaga) : IObservador<EventoSensor>
{
    public void Atualizar(EventoSensor evento)
    {
        if (evento.Tipo == TipoEventoSensor.Ocupada) vaga.Ocupar();
        else vaga.Liberar();
    }
}
