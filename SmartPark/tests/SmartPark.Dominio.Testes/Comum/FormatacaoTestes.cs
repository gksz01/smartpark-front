using SmartPark.Dominio.Comum;

namespace SmartPark.Dominio.Testes.Comum;

public class FormatacaoTestes
{
    [Theory]
    [InlineData(12, "R$ 12,00")]
    [InlineData(50.4, "R$ 50,40")]
    [InlineData(0, "R$ 0,00")]
    public void FormatarMoeda_DeveUsarFormatoEmReais(decimal valor, string esperado)
    {
        Assert.Equal(esperado, Formatacao.FormatarMoeda(valor));
    }

    [Fact]
    public void FormatarHora_DeveUsarHHmm()
    {
        Assert.Equal("09:05", Formatacao.FormatarHora(new DateTime(2026, 10, 5, 9, 5, 0)));
    }

    [Fact]
    public void FormatarDataIso_DeveUsarAAAAMMDD()
    {
        Assert.Equal("2026-01-07", Formatacao.FormatarDataIso(new DateOnly(2026, 1, 7)));
    }
}
