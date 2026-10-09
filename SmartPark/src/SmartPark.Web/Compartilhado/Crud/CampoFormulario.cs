using System.Globalization;
using SmartPark.Aplicacao.Comum;

namespace SmartPark.Web.Compartilhado.Crud;

public enum TipoCampo
{
    Texto,
    Numero,
    Data,
    Hora,
    Selecao,
}

public sealed record OpcaoSelecao(string Valor, string Texto)
{
    /// <summary>Opções a partir de valores de enum, com o texto de Rotulos.</summary>
    public static IReadOnlyList<OpcaoSelecao> DeEnum<TEnum>(IEnumerable<TEnum> valores) where TEnum : struct, Enum =>
        valores.Select(valor => new OpcaoSelecao(valor.ToString(), Rotulos.De(valor))).ToList();
}

/// <summary>
/// Descrição de um campo de formulário: rótulo, tipo e como ler/gravar o valor no modelo da tela.
/// O CamposFormulario desenha a lista de campos (equivale ao FieldConfig da versão React).
/// O valor trafega como texto; as fábricas abaixo fazem a conversão para o tipo do modelo.
/// </summary>
public sealed record CampoFormulario(string Rotulo, TipoCampo Tipo, Func<string> Ler, Action<string> Gravar)
{
    public IReadOnlyList<OpcaoSelecao> Opcoes { get; init; } = [];
    public string? Exemplo { get; init; }
    public string? Dica { get; init; }
    public bool Desabilitado { get; init; }

    /// <summary>Campos de texto e número são obrigatórios no formulário, salvo quando marcados como opcionais.</summary>
    public bool Opcional { get; init; }

    /// <summary>Quando informado, o campo só aparece se a função devolver true (ex.: parcelas só no crédito).</summary>
    public Func<bool>? Visivel { get; init; }

    public static CampoFormulario Texto(string rotulo, Func<string> ler, Action<string> gravar, string? exemplo = null) =>
        new(rotulo, TipoCampo.Texto, ler, gravar) { Exemplo = exemplo };

    /// <summary>Campo numérico; vazio vira null.</summary>
    public static CampoFormulario Numero(string rotulo, Func<decimal?> ler, Action<decimal?> gravar) =>
        new(rotulo, TipoCampo.Numero,
            () => ler()?.ToString(CultureInfo.InvariantCulture) ?? "",
            texto => gravar(decimal.TryParse(texto, NumberStyles.Number, CultureInfo.InvariantCulture, out var numero) ? numero : null));

    public static CampoFormulario Data(string rotulo, Func<DateOnly> ler, Action<DateOnly> gravar) =>
        new(rotulo, TipoCampo.Data,
            () => ler().ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            texto => { if (DateOnly.TryParse(texto, CultureInfo.InvariantCulture, out var data)) gravar(data); });

    public static CampoFormulario Hora(string rotulo, Func<TimeOnly> ler, Action<TimeOnly> gravar) =>
        new(rotulo, TipoCampo.Hora,
            () => ler().ToString("HH:mm", CultureInfo.InvariantCulture),
            texto => { if (TimeOnly.TryParse(texto, CultureInfo.InvariantCulture, out var hora)) gravar(hora); });

    /// <summary>Sim/não exibido como seleção, como na versão React (ex.: Ativo / Inativo).</summary>
    public static CampoFormulario Booleano(string rotulo, Func<bool> ler, Action<bool> gravar, string textoVerdadeiro = "Ativo", string textoFalso = "Inativo") =>
        new(rotulo, TipoCampo.Selecao, () => ler() ? "true" : "false", texto => gravar(texto == "true"))
        {
            Opcoes = [new OpcaoSelecao("true", textoVerdadeiro), new OpcaoSelecao("false", textoFalso)],
        };

    public static CampoFormulario Selecao<TEnum>(string rotulo, Func<TEnum> ler, Action<TEnum> gravar, IEnumerable<TEnum> opcoes)
        where TEnum : struct, Enum =>
        new(rotulo, TipoCampo.Selecao, () => ler().ToString(), texto => gravar(Enum.Parse<TEnum>(texto))) { Opcoes = OpcaoSelecao.DeEnum(opcoes) };

    /// <summary>Seleção de um registro pelo id (ex.: veículo, vaga).</summary>
    public static CampoFormulario Selecao(string rotulo, Func<int> ler, Action<int> gravar, IReadOnlyList<OpcaoSelecao> opcoes) =>
        new(rotulo, TipoCampo.Selecao, () => ler().ToString(CultureInfo.InvariantCulture),
            texto => gravar(int.TryParse(texto, out var id) ? id : 0))
        { Opcoes = opcoes };
}
