using SmartPark.Dominio.Padroes.Observador;

namespace SmartPark.Dominio.Testes.Padroes;

/// <summary>Observador de teste que só guarda os eventos recebidos.</summary>
public class ObservadorFalso<TEvento> : IObservador<TEvento>
{
    public List<TEvento> Recebidos { get; } = [];

    public void Atualizar(TEvento evento) => Recebidos.Add(evento);
}
