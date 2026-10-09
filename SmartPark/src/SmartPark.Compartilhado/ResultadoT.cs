namespace SmartPark.Compartilhado;

/// <summary>Resultado de um caso de uso que devolve dados: sucesso com Dados, ou falha esperada com Erro.</summary>
public sealed record Resultado<T>(bool Sucesso, T? Dados, string? Erro)
{
    public static Resultado<T> Ok(T dados) => new(true, dados, null);

    public static Resultado<T> Falha(string erro) => new(false, default, erro);
}
