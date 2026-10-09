using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Dominio.Testes.Entidades;

public class TarifaTestes
{
    [Fact]
    public void Calcular_DeveCobrarPorHoraIniciada()
    {
        var tarifa = new Tarifa(1, "shopping", "Padrão", new TarifaPorHora(12));

        Assert.Equal(24, tarifa.Calcular(2));
        Assert.Equal(36, tarifa.Calcular(2.2m));
        Assert.Equal(0, tarifa.Calcular(0));
    }

    [Fact]
    public void Calcular_DeveRespeitarValorMaximoDiario()
    {
        var tarifa = new Tarifa(1, "shopping", "Padrão", new TarifaPorHora(12, 60));

        Assert.Equal(60, tarifa.Calcular(8));
        Assert.Equal("Padrão: R$ 12,00/hora (máx. R$ 60,00/dia)", tarifa.Descricao());
    }
}
