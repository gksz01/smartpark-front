using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.LinhaDeProduto;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;
using SmartPark.Dominio.Padroes.Fabrica.Variantes;

namespace SmartPark.Dominio.Testes.Padroes;

public class FabricaVarianteTestes
{
    private static readonly VarianteSmartPark[] Variantes = [new VarianteShopping(), new VarianteHospital(), new VarianteCondominio(), new VarianteEmpresa()];
    private static readonly Convenio SaudePlena = new(1, "hospital", "Saúde Plena", TipoBeneficio.Isencao);

    [Fact]
    public void CriarEstrategiaTarifa_DeveVariarConformeAVariante()
    {
        var estrategias = Variantes.Select(variante => variante.CriarEstrategiaTarifa()).ToList();

        Assert.IsType<TarifaPorHora>(estrategias[0]); // Shopping
        Assert.IsType<TarifaPorHora>(estrategias[1]); // Hospital (sem convênio)
        Assert.IsType<TarifaIsenta>(estrategias[2]); // Condomínio
        Assert.IsType<TarifaIsenta>(estrategias[3]); // Empresa
    }

    [Fact]
    public void CriarVagaPadrao_DeveVariarConformeAVariante()
    {
        var vagas = Variantes.Select(variante => variante.CriarVagaPadrao(1, "X-01", "X")).ToList();

        Assert.IsType<VagaComum>(vagas[0]);
        Assert.IsType<VagaPrioritaria>(vagas[1]);
        Assert.IsType<VagaNominal>(vagas[2]);
        Assert.IsType<VagaComum>(vagas[3]);
    }

    [Fact]
    public void CriarTarifa_DeveMontarTarifaComAEstrategiaDaVariante()
    {
        Assert.Equal([36m, 30m, 0m, 0m], Variantes.Select(variante => variante.CriarTarifa(1).Calcular(3)));
        Assert.Equal("Tarifa Aurora: R$ 12,00/hora (máx. R$ 60,00/dia)", new VarianteShopping().CriarTarifa(1).Descricao());
    }

    [Fact]
    public void Configuracao_DeveVirDoRegistroTenants_SemCopia()
    {
        Assert.Same(RegistroTenants.Obter(RegistroTenants.Hospital), new VarianteHospital().Configuracao());
        Assert.Same(RegistroTenants.Obter(RegistroTenants.Condominio), new VarianteCondominio().Configuracao());
    }

    [Fact]
    public void CriarTarifa_DeveSerCoerenteComORecursoCobranca()
    {
        foreach (var variante in Variantes)
            Assert.Equal(variante.PossuiRecurso(Recurso.Cobranca), variante.CriarTarifa(1).Calcular(2) > 0);
    }

    [Fact]
    public void CriarEstrategiaTarifa_DeveAplicarConvenio_QuandoHospitalTemConvenioMedico()
    {
        var hospital = new VarianteHospital();

        Assert.True(hospital.PossuiRecurso(Recurso.ConvenioMedico));
        Assert.IsType<TarifaComConvenio>(hospital.CriarEstrategiaTarifa(SaudePlena));
        Assert.Equal(0, hospital.CriarTarifa(1, SaudePlena).Calcular(3));
    }

    [Fact]
    public void CriarEstrategiaTarifa_DeveIgnorarConvenio_QuandoShoppingNaoTemConvenioMedico()
    {
        VarianteSmartPark shopping = new VarianteShopping();

        Assert.False(shopping.PossuiRecurso(Recurso.ConvenioMedico));
        Assert.IsType<TarifaPorHora>(shopping.CriarEstrategiaTarifa(SaudePlena));
        Assert.Equal(36, shopping.CriarTarifa(1, SaudePlena).Calcular(3));
    }

    [Fact]
    public void CriarVagaPadrao_DeveSerPrioritaria_NoHospital()
    {
        var vaga = new VarianteHospital().CriarVagaPadrao(1, "H-01", "H");

        Assert.Equal(TipoVaga.Prioritaria, vaga.Tipo);
        Assert.Equal("Exclusiva para pacientes e acompanhantes", vaga.RequisitoDeUso());
    }

    [Fact]
    public void VariantePorTenant_DeveTerUmaVarianteParaCadaTenant()
    {
        foreach (var tenant in RegistroTenants.Todos)
            Assert.Equal(tenant.Identificador, VariantePorTenant.Obter(tenant.Identificador).TenantId);
    }
}
