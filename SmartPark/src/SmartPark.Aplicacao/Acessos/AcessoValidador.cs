namespace SmartPark.Aplicacao.Acessos;

public static class AcessoValidador
{
    public static string? Validar(DadosAcesso dados)
    {
        if (string.IsNullOrWhiteSpace(dados.Pessoa)) return "Informe o campo Pessoa.";
        if (string.IsNullOrWhiteSpace(dados.Identificador)) return "Informe o identificador do acesso.";
        return null;
    }
}
