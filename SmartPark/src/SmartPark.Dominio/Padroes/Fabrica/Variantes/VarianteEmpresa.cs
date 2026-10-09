using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.LinhaDeProduto;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Dominio.Padroes.Fabrica.Variantes;

/// <summary>Creator concreto: Empresa não cobra dos funcionários (sem Cobranca) e usa vagas comuns.</summary>
public class VarianteEmpresa() : VarianteSmartPark(RegistroTenants.Empresa)
{
    public override IEstrategiaTarifa CriarEstrategiaTarifa(Convenio? convenio = null) => new TarifaIsenta();

    public override Vaga CriarVagaPadrao(int id, string codigo, string setor) => new VagaComum(id, TenantId, codigo, setor);
}
