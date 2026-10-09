using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.LinhaDeProduto;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Dominio.Padroes.Fabrica.Variantes;

/// <summary>Creator concreto: Hospital cobra por hora, aceita convênio médico e usa vagas prioritárias.</summary>
public class VarianteHospital() : VarianteSmartPark(RegistroTenants.Hospital)
{
    /// <summary>O convênio só é aplicado se o recurso ConvenioMedico estiver ligado no RegistroTenants.</summary>
    public override IEstrategiaTarifa CriarEstrategiaTarifa(Convenio? convenio = null)
    {
        var tarifaBase = new TarifaPorHora(10, 50);
        if (convenio is not null && PossuiRecurso(Recurso.ConvenioMedico))
            return new TarifaComConvenio(tarifaBase, convenio);
        return tarifaBase;
    }

    public override Vaga CriarVagaPadrao(int id, string codigo, string setor) => new VagaPrioritaria(id, TenantId, codigo, setor);
}
