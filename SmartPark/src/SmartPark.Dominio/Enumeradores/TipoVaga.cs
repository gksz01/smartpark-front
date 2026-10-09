namespace SmartPark.Dominio.Enumeradores;

/// <summary>Tipos de vaga. Cada tipo tem um Creator no Factory Method de vagas.</summary>
public enum TipoVaga
{
    Comum,
    PCD,
    Eletrica,
    Nominal,
    Restrita,
    Prioritaria,
}
