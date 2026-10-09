using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Infraestrutura.Persistencia.Configuracoes;

/// <summary>Monta o SQL das restrições CHECK repetidas em várias tabelas.</summary>
internal static class Restricoes
{
    /// <summary>TenantId só aceita os tenants do RegistroTenants.</summary>
    public static string TenantValido { get; } = Em("TenantId", RegistroTenants.Todos.Select(tenant => tenant.Identificador));

    /// <summary>A coluna só aceita os nomes do enum (ex.: Status IN ('Livre', 'Ocupada', ...)).</summary>
    public static string ValoresDe<TEnum>(string coluna) where TEnum : struct, Enum => Em(coluna, Enum.GetNames<TEnum>());

    private static string Em(string coluna, IEnumerable<string> valores) =>
        $"{coluna} IN ({string.Join(", ", valores.Select(valor => $"'{valor}'"))})";
}
