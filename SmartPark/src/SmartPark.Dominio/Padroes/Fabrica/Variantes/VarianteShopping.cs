using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.LinhaDeProduto;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Dominio.Padroes.Fabrica.Variantes;

/// <summary>Creator concreto: Shopping cobra R$ 12/hora com teto diário e usa vagas comuns.</summary>
public class VarianteShopping() : VarianteSmartPark(RegistroTenants.Shopping)
{
    public override IEstrategiaTarifa CriarEstrategiaTarifa(Convenio? convenio = null) => new TarifaPorHora(12, 60);

    public override Vaga CriarVagaPadrao(int id, string codigo, string setor) => new VagaComum(id, TenantId, codigo, setor);
}
