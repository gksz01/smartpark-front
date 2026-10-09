using SmartPark.Aplicacao.Comum;
using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Aplicacao.Vagas;

/// <summary>O tipo de vaga permitido depende do tenant (TiposVaga).</summary>
public static class VagaValidador
{
    public static string? Validar(DadosVaga dados, DefinicaoTenant tenant)
    {
        if (string.IsNullOrWhiteSpace(dados.Codigo)) return "Informe o campo Código.";
        if (string.IsNullOrWhiteSpace(dados.Setor)) return "Informe o campo Setor.";
        if (!tenant.TiposVaga.Contains(dados.Tipo))
            return $"Tipo de vaga não permitido em {tenant.Nome}. Use: {Rotulos.Lista(tenant.TiposVaga)}.";
        return null;
    }
}
