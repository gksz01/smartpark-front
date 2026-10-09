namespace SmartPark.Dominio.Padroes.Observador;

/// <summary>OBSERVER — contrato de quem quer ser avisado de um evento do tipo TEvento.</summary>
public interface IObservador<in TEvento>
{
    void Atualizar(TEvento evento);
}
