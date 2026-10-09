using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Dominio.Testes.Entidades;

public class ConvenioTestes
{
    private static readonly TarifaPorHora TarifaHospital = new(10);

    [Fact]
    public void AplicarBeneficio_DeveAplicarCadaTipoDeBeneficio()
    {
        Assert.Equal(0, new Convenio(1, "hospital", "Saúde Plena", TipoBeneficio.Isencao).AplicarBeneficio(TarifaHospital, 3));
        Assert.Equal(15, new Convenio(2, "hospital", "VidaCare", TipoBeneficio.Percentual, 50).AplicarBeneficio(TarifaHospital, 3));
        Assert.Equal(10, new Convenio(3, "hospital", "Bem Estar", TipoBeneficio.HorasGratis, 2).AplicarBeneficio(TarifaHospital, 3));
    }

    [Fact]
    public void AplicarBeneficio_DeveCobrarValorCheio_QuandoConvenioInativo()
    {
        Assert.Equal(30, new Convenio(1, "hospital", "Saúde Plena", TipoBeneficio.Isencao, 0, false).AplicarBeneficio(TarifaHospital, 3));
    }

    [Fact]
    public void DescricaoBeneficio_DeveUsarOsTextosDoModuloDeConvenio()
    {
        Assert.Equal("Isenção de 100%", new Convenio(1, "hospital", "Saúde Plena", TipoBeneficio.Isencao).DescricaoBeneficio());
        Assert.Equal("Desconto de 50%", new Convenio(2, "hospital", "VidaCare", TipoBeneficio.Percentual, 50).DescricaoBeneficio());
        Assert.Equal("2 horas gratuitas", new Convenio(3, "hospital", "Bem Estar", TipoBeneficio.HorasGratis, 2).DescricaoBeneficio());
    }

    [Theory]
    [InlineData(TipoBeneficio.Percentual, 0)]
    [InlineData(TipoBeneficio.Percentual, 101)]
    [InlineData(TipoBeneficio.HorasGratis, 0)]
    public void Construtor_DeveFalhar_QuandoValorDoBeneficioForInvalido(TipoBeneficio tipo, int valor)
    {
        Assert.Throws<RegraDeNegocioException>(() => new Convenio(1, "hospital", "Teste", tipo, valor));
    }
}
