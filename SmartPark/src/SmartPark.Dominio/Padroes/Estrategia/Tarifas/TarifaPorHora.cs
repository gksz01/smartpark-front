using SmartPark.Dominio.Comum;

namespace SmartPark.Dominio.Padroes.Estrategia.Tarifas;

/// <summary>Estratégia concreta: cobra por hora iniciada, com teto diário opcional (Shopping).</summary>
public class TarifaPorHora(decimal valorHora, decimal? valorMaximoDiario = null) : IEstrategiaTarifa
{
    public decimal ValorHora { get; } = valorHora;
    public decimal? ValorMaximoDiario { get; } = valorMaximoDiario;

    /// <summary>Ex.: 2h10min são cobradas como 3 horas.</summary>
    public decimal Calcular(decimal duracaoHoras)
    {
        if (duracaoHoras <= 0) return 0;
        var valor = Math.Ceiling(duracaoHoras) * ValorHora;
        return ValorMaximoDiario is decimal maximo ? Math.Min(valor, maximo) : valor;
    }

    public string Descricao()
    {
        var texto = $"{Formatacao.FormatarMoeda(ValorHora)}/hora";
        return ValorMaximoDiario is decimal maximo ? $"{texto} (máx. {Formatacao.FormatarMoeda(maximo)}/dia)" : texto;
    }
}
