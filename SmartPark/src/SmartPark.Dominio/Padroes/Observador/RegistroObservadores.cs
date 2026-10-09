using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Padroes.Fabrica.Variantes;
using SmartPark.Dominio.Padroes.Observador.Reservas;
using SmartPark.Dominio.Padroes.Observador.Sensores;

namespace SmartPark.Dominio.Padroes.Observador;

/// <summary>
/// Montagem dos observers para uma variante da LPS.
/// O teste do recurso Notificacoes NÃO faz parte do padrão: só decide se o observador
/// de notificação participa desta variante. O Observavel continua sem nenhum if de recurso.
/// </summary>
public static class RegistroObservadores
{
    public static void RegistrarObservadoresSensor(Sensor sensor, Vaga vaga, VarianteSmartPark variante, List<Notificacao> notificacoes)
    {
        sensor.Inscrever(new ObservadorVagaSensor(vaga));
        if (variante.PossuiRecurso(Recurso.Notificacoes))
            sensor.Inscrever(new ObservadorNotificacaoSensor(notificacoes));
    }

    public static EventosReserva CriarEventosReserva(Estacionamento estacionamento, VarianteSmartPark variante, List<Notificacao> notificacoes)
    {
        var eventos = new EventosReserva();
        eventos.Inscrever(new ObservadorVagaReserva(estacionamento));
        if (variante.PossuiRecurso(Recurso.Notificacoes))
            eventos.Inscrever(new ObservadorNotificacaoReserva(notificacoes));
        return eventos;
    }
}
