using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Dominio.Testes.Entidades;

public class EstacionamentoTestes
{
    private static Estacionamento CriarEstacionamento() => new(1, "shopping", "Estacionamento Central", "Av. das Palmeiras, 450", true, false,
    [
        new VagaComum(1, "shopping", "A-01", "A", StatusVaga.Livre),
        new VagaPCD(2, "shopping", "A-02", "A", StatusVaga.Ocupada),
        new VagaEletrica(3, "shopping", "A-03", "A", StatusVaga.Reservada),
        new VagaPCD(4, "shopping", "A-04", "A", StatusVaga.Livre),
    ]);

    [Fact]
    public void TaxaOcupacao_DeveContarVagasNaoLivres()
    {
        var estacionamento = CriarEstacionamento();

        Assert.Equal(4, estacionamento.TotalVagas());
        Assert.Equal(2, estacionamento.VagasLivres());
        Assert.Equal(50, estacionamento.TaxaOcupacao());
        Assert.False(estacionamento.EstaLotado());
    }

    [Fact]
    public void BuscarVagaLivre_DeveFiltrarPorTipo()
    {
        var estacionamento = CriarEstacionamento();

        Assert.Equal("A-04", estacionamento.BuscarVagaLivre(TipoVaga.PCD)?.Codigo);
        Assert.Null(estacionamento.BuscarVagaLivre(TipoVaga.Eletrica));
    }

    [Fact]
    public void EstaLotado_DeveSerVerdadeiro_QuandoNaoHaVagasLivres()
    {
        var estacionamento = CriarEstacionamento();

        foreach (var vaga in estacionamento.Vagas.Where(vaga => vaga.EstaDisponivel())) vaga.Ocupar();

        Assert.True(estacionamento.EstaLotado());
        Assert.Equal(100, estacionamento.TaxaOcupacao());
    }

    [Fact]
    public void AdicionarVaga_DeveFalhar_QuandoCodigoJaExiste()
    {
        var estacionamento = CriarEstacionamento();

        var erro = Assert.Throws<RegraDeNegocioException>(() => estacionamento.AdicionarVaga(new VagaComum(5, "shopping", "A-01", "A")));
        Assert.Contains("Já existe", erro.Message);
    }
}
