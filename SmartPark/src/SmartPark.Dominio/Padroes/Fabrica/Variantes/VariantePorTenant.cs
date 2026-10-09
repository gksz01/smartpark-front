using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Dominio.Padroes.Fabrica.Variantes;

/// <summary>Qual variante (Creator do Factory Method) representa cada tenant.</summary>
public static class VariantePorTenant
{
    private static readonly Dictionary<string, VarianteSmartPark> Variantes = new()
    {
        [RegistroTenants.Shopping] = new VarianteShopping(),
        [RegistroTenants.Condominio] = new VarianteCondominio(),
        [RegistroTenants.Hospital] = new VarianteHospital(),
        [RegistroTenants.Empresa] = new VarianteEmpresa(),
    };

    public static VarianteSmartPark Obter(string tenantId) => Variantes[tenantId];
}
