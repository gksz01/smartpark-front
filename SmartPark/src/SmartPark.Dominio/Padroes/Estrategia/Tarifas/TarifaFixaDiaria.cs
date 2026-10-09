using SmartPark.Dominio.Comum;

namespace SmartPark.Dominio.Padroes.Estrategia.Tarifas;

/// <summary>Estratégia concreta: valor único por dia iniciado, independente das horas.</summary>
public class TarifaFixaDiaria(decimal valorDiaria) : IEstrategiaTarifa
{
    private const int HorasPorDia = 24;

    public decimal ValorDiaria { get; } = valorDiaria;

    /// <summary>Ex.: 3 horas = 1 diária; 30 horas = 2 diárias.</summary>
    public decimal Calcular(decimal duracaoHoras) =>
        duracaoHoras <= 0 ? 0 : Math.Ceiling(duracaoHoras / HorasPorDia) * ValorDiaria;

    public string Descricao() => $"{Formatacao.FormatarMoeda(ValorDiaria)}/dia";
}
