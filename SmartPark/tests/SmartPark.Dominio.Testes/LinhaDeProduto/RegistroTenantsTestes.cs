using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Dominio.Testes.LinhaDeProduto;

public class RegistroTenantsTestes
{
    [Fact]
    public void Todos_DeveTerAsQuatroVariantes_NaOrdemDaTela()
    {
        Assert.Equal(["shopping", "condominium", "hospital", "company"], RegistroTenants.Todos.Select(tenant => tenant.Identificador));
    }

    [Fact]
    public void Obter_DeveFalhar_QuandoTenantNaoExiste()
    {
        Assert.False(RegistroTenants.Existe("aeroporto"));
        Assert.Throws<EntidadeNaoEncontradaException>(() => RegistroTenants.Obter("aeroporto"));
    }

    [Fact]
    public void PossuiRecurso_DeveRefletirAConfiguracaoDeCadaTenant()
    {
        var shopping = RegistroTenants.Obter(RegistroTenants.Shopping);
        var hospital = RegistroTenants.Obter(RegistroTenants.Hospital);

        Assert.True(shopping.PossuiRecurso(Recurso.Reserva));
        Assert.False(shopping.PossuiRecurso(Recurso.ConvenioMedico));
        Assert.True(hospital.PossuiRecurso(Recurso.ConvenioMedico));
        Assert.False(hospital.PossuiRecurso(Recurso.Reserva));
    }

    [Fact]
    public void MetodoAcessoECamposVeiculo_DevemVariarPorTenant()
    {
        Assert.Equal(MetodoAcesso.QrCode, RegistroTenants.Obter(RegistroTenants.Condominio).MetodoAcesso);
        Assert.Equal("tagRfid", Assert.Single(RegistroTenants.Obter(RegistroTenants.Empresa).CamposVeiculo).Chave);
        Assert.Empty(RegistroTenants.Obter(RegistroTenants.Shopping).CamposVeiculo);
    }
}
