using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.LinhaDeProduto;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Dominio.Padroes.Fabrica.Variantes;

/// <summary>Creator concreto: Condomínio não cobra (sem Cobranca) e usa vagas nominais.</summary>
public class VarianteCondominio() : VarianteSmartPark(RegistroTenants.Condominio)
{
    public override IEstrategiaTarifa CriarEstrategiaTarifa(Convenio? convenio = null) => new TarifaIsenta();

    public override Vaga CriarVagaPadrao(int id, string codigo, string setor) => new VagaNominal(id, TenantId, codigo, setor);
}
