using SmartPark.Aplicacao.Comum;
using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Aplicacao.Pessoas;

/// <summary>Tipo e perfil permitidos dependem do tenant (TiposPessoa e PerfisPermitidos).</summary>
public static class PessoaValidador
{
    public static string? Validar(DadosPessoa dados, DefinicaoTenant tenant)
    {
        if (string.IsNullOrWhiteSpace(dados.Nome)) return "Informe o campo Nome.";
        if (string.IsNullOrWhiteSpace(dados.Documento)) return "Informe o campo Documento.";
        if (!tenant.TiposPessoa.Contains(dados.Tipo))
            return $"Tipo de pessoa não permitido em {tenant.Nome}. Use: {Rotulos.Lista(tenant.TiposPessoa)}.";
        if (!tenant.PerfisPermitidos.Contains(dados.Perfil))
            return $"Perfil não permitido em {tenant.Nome}. Use: {Rotulos.Lista(tenant.PerfisPermitidos)}.";
        return null;
    }
}
