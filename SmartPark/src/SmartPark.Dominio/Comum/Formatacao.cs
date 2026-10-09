using System.Globalization;

namespace SmartPark.Dominio.Comum;

/// <summary>Formatação compartilhada pelo domínio e pelas telas, para o mesmo texto não ser repetido.</summary>
public static class Formatacao
{
    private static readonly CultureInfo Brasil = new("pt-BR");

    /// <summary>Ex.: 12 → "R$ 12,00".</summary>
    public static string FormatarMoeda(decimal valor) => $"R$ {valor.ToString("F2", Brasil)}";

    /// <summary>Ex.: 14:05 → "14:05".</summary>
    public static string FormatarHora(DateTime data) => data.ToString("HH:mm", CultureInfo.InvariantCulture);

    public static string FormatarHora(TimeOnly hora) => hora.ToString("HH:mm", CultureInfo.InvariantCulture);

    /// <summary>Ex.: 5 de outubro de 2026 → "2026-10-05" (formato dos campos de data).</summary>
    public static string FormatarDataIso(DateOnly data) => data.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
}
