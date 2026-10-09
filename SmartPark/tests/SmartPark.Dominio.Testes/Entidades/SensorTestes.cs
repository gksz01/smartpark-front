using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Dominio.Testes.Entidades;

public class SensorTestes
{
    [Fact]
    public void DetectarOcupacao_DeveInformarSeOEstadoMudou()
    {
        var sensor = new Sensor(1, "SN-A01", 1);
        var momento = new DateTime(2026, 9, 5, 14, 0, 0);

        Assert.True(sensor.DetectarOcupacao(momento));
        Assert.True(sensor.Ocupado);
        Assert.Equal(momento, sensor.UltimaLeitura);
        Assert.False(sensor.DetectarOcupacao());
        Assert.True(sensor.DetectarLiberacao());
        Assert.False(sensor.Ocupado);
    }

    [Fact]
    public void DetectarOcupacao_DeveFalhar_QuandoSensorDesativado()
    {
        var sensor = new Sensor(1, "SN-A01", 1);

        sensor.Desativar();
        Assert.Contains("está desativado", Assert.Throws<RegraDeNegocioException>(() => sensor.DetectarOcupacao()).Message);

        sensor.Ativar();
        Assert.True(sensor.DetectarOcupacao());
    }
}
