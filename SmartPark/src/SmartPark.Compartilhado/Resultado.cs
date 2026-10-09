namespace SmartPark.Compartilhado;

/// <summary>Resultado de um caso de uso que não devolve dados (ex.: exclusão).</summary>
public sealed record Resultado(bool Sucesso, string? Erro)
{
    public static Resultado Ok() => new(true, null);

    public static Resultado Falha(string erro) => new(false, erro);
}
