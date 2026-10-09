namespace SmartPark.Dominio.Padroes.Observador;

/// <summary>
/// OBSERVER — Subject genérico e reutilizável.
/// Guarda os observadores e avisa todos quando um evento acontece, sem saber quem são.
/// Reutilizado por Sensor (Exemplo 1) e por EventosReserva (Exemplo 2).
/// </summary>
public abstract class Observavel<TEvento>
{
    private readonly List<IObservador<TEvento>> _observadores = [];

    /// <summary>Adiciona um observador (ignorando se ele já estiver inscrito).</summary>
    public void Inscrever(IObservador<TEvento> observador)
    {
        if (!_observadores.Contains(observador)) _observadores.Add(observador);
    }

    public void Desinscrever(IObservador<TEvento> observador) => _observadores.Remove(observador);

    public int QuantidadeObservadores() => _observadores.Count;

    /// <summary>Entrega o evento a cada observador inscrito, na ordem de inscrição.</summary>
    protected void Notificar(TEvento evento)
    {
        foreach (var observador in _observadores) observador.Atualizar(evento);
    }
}
