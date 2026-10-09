using SmartPark.Dominio.Entidades;

namespace SmartPark.Dominio.Testes.Entidades;

public class VeiculoTestes
{
    [Theory]
    [InlineData("abc-1234", true)]
    [InlineData("bra2e19", true)]
    [InlineData("12ABC34", false)]
    public void ValidarPlaca_DeveAceitarPadraoAntigoEMercosul(string placa, bool esperado)
    {
        Assert.Equal(esperado, new Veiculo(1, "shopping", placa, "Gol", "Prata", "Carro").ValidarPlaca());
    }

    [Fact]
    public void PlacaFormatada_DeveSeguirOPadraoDaPlaca()
    {
        var antigo = new Veiculo(1, "shopping", "abc1234", "Gol", "Prata", "Antigo");
        var mercosul = new Veiculo(2, "shopping", "spk 1a23", "City", "Cinza", "Meu carro");

        Assert.Equal("ABC-1234", antigo.PlacaFormatada());
        Assert.Equal("SPK1A23", mercosul.PlacaFormatada());
        Assert.True(mercosul.EhPlacaMercosul());
        Assert.Equal("Meu carro · City · SPK1A23", mercosul.Descricao());
    }
}
