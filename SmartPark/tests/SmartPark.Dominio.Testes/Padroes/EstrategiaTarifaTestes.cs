using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Dominio.Testes.Padroes;

public class EstrategiaTarifaTestes
{
    [Fact]
    public void Calcular_DeveDarValoresDiferentes_ComEstrategiasDiferentes()
    {
        var porHora = new Tarifa(1, "shopping", "Shopping", new TarifaPorHora(12));
        var diaria = new Tarifa(2, "shopping", "Mensalista", new TarifaFixaDiaria(40));
        var convenio = new Convenio(1, "hospital", "VidaCare", TipoBeneficio.Percentual, 50);
        var comConvenio = new Tarifa(3, "shopping", "Hospital", new TarifaComConvenio(new TarifaPorHora(12), convenio));

        // Mesma chamada, mesmo parâmetro (3 horas), resultados diferentes.
        Assert.Equal(36, porHora.Calcular(3));
        Assert.Equal(40, diaria.Calcular(3));
        Assert.Equal(18, comConvenio.Calcular(3));
    }

    [Fact]
    public void DefinirEstrategia_DeveMudarOResultado_SemAlterarATarifa()
    {
        var tarifa = new Tarifa(1, "shopping", "Estacionamento Central", new TarifaPorHora(12));
        Assert.Equal(60, tarifa.Calcular(5));
        Assert.Equal("Estacionamento Central: R$ 12,00/hora", tarifa.Descricao());

        tarifa.DefinirEstrategia(new TarifaFixaDiaria(40));

        Assert.Equal(40, tarifa.Calcular(5));
        Assert.Equal("Estacionamento Central: R$ 40,00/dia", tarifa.Descricao());
    }

    [Fact]
    public void Calcular_DeveFuncionarComQualquerEstrategiaDoContrato()
    {
        IEstrategiaTarifa[] estrategias =
        [
            new TarifaPorHora(10),
            new TarifaFixaDiaria(50),
            new TarifaComConvenio(new TarifaPorHora(10), new Convenio(1, "hospital", "Saúde Plena", TipoBeneficio.Isencao)),
        ];

        var resultados = estrategias.Select(estrategia => new Tarifa(1, "shopping", "Teste", estrategia).Calcular(2));

        Assert.Equal([20m, 50m, 0m], resultados);
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(24, 40)]
    [InlineData(30, 80)]
    public void TarifaFixaDiaria_DeveCobrarPorDiaIniciado(decimal horas, decimal esperado)
    {
        Assert.Equal(esperado, new TarifaFixaDiaria(40).Calcular(horas));
    }

    [Fact]
    public void TarifaComConvenio_DeveAplicarBeneficio_SobreQualquerEstrategiaBase()
    {
        var sobrePorHora = new TarifaComConvenio(new TarifaPorHora(10), new Convenio(3, "hospital", "Bem Estar", TipoBeneficio.HorasGratis, 2));
        var sobreDiaria = new TarifaComConvenio(new TarifaFixaDiaria(40), new Convenio(2, "hospital", "VidaCare", TipoBeneficio.Percentual, 25));

        Assert.Equal(10, sobrePorHora.Calcular(3));
        Assert.Equal(30, sobreDiaria.Calcular(3));
        Assert.Equal("R$ 10,00/hora com convênio Bem Estar (2 horas gratuitas)", sobrePorHora.Descricao());
    }

    [Fact]
    public void CalcularEstimativa_DeveUsarTarifa_SemConhecerAEstrategiaConcreta()
    {
        var reserva = new Reserva(1, "shopping", 1, 3, new DateOnly(2026, 9, 5), new TimeOnly(18, 30), 4);

        Assert.Equal(48, reserva.CalcularEstimativa(new Tarifa(1, "shopping", "Por hora", new TarifaPorHora(12))));
        Assert.Equal(40, reserva.CalcularEstimativa(new Tarifa(2, "shopping", "Diária", new TarifaFixaDiaria(40))));
    }

    [Fact]
    public void Criar_DeveReconstruirTarifaPorHora_QuandoTipoPorHora()
    {
        var tarifa = new Tarifa(1, "shopping", "Shopping", EstrategiaTarifaPorTipo.Criar(new(TipoEstrategiaTarifa.PorHora, 12, 60)));

        Assert.IsType<TarifaPorHora>(tarifa.Estrategia);
        Assert.Equal(36, tarifa.Calcular(3));
    }

    [Fact]
    public void Criar_DeveReconstruirTarifaFixaDiaria_QuandoTipoDiaria()
    {
        var tarifa = new Tarifa(2, "shopping", "Diária", EstrategiaTarifaPorTipo.Criar(new(TipoEstrategiaTarifa.Diaria, 40, null)));

        Assert.IsType<TarifaFixaDiaria>(tarifa.Estrategia);
        Assert.Equal(40, tarifa.Calcular(3));
    }

    [Fact]
    public void Criar_DeveReconstruirTarifaIsenta_QuandoTipoIsenta()
    {
        var tarifa = new Tarifa(3, "shopping", "Cortesia", EstrategiaTarifaPorTipo.Criar(new(TipoEstrategiaTarifa.Isenta, 0, null)));

        Assert.IsType<TarifaIsenta>(tarifa.Estrategia);
        Assert.Equal(0, tarifa.Calcular(3));
    }

    [Fact]
    public void ObterConfiguracao_DeveFazerOCaminhoInversoDoBanco()
    {
        Assert.Equal(new ConfiguracaoTarifa(TipoEstrategiaTarifa.PorHora, 12, 60), EstrategiaTarifaPorTipo.ObterConfiguracao(new TarifaPorHora(12, 60)));
        Assert.Equal(new ConfiguracaoTarifa(TipoEstrategiaTarifa.PorHora, 9, null), EstrategiaTarifaPorTipo.ObterConfiguracao(new TarifaPorHora(9)));
        Assert.Equal(new ConfiguracaoTarifa(TipoEstrategiaTarifa.Diaria, 40, null), EstrategiaTarifaPorTipo.ObterConfiguracao(new TarifaFixaDiaria(40)));
        Assert.Equal(new ConfiguracaoTarifa(TipoEstrategiaTarifa.Isenta, 0, null), EstrategiaTarifaPorTipo.ObterConfiguracao(new TarifaIsenta()));
    }

    [Fact]
    public void ObterConfiguracao_DeveFalhar_QuandoTarifaComConvenio()
    {
        var comConvenio = new TarifaComConvenio(new TarifaPorHora(10), new Convenio(1, "hospital", "Saúde Plena", TipoBeneficio.Isencao));

        var erro = Assert.Throws<RegraDeNegocioException>(() => EstrategiaTarifaPorTipo.ObterConfiguracao(comConvenio));
        Assert.Contains("não pode ser gravada", erro.Message);
    }
}
