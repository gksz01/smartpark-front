using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Dominio.Testes.Entidades;

public class VagaTestes
{
    [Fact]
    public void Ciclo_DeveIrDeLivreParaReservadaOcupadaELivre()
    {
        var vaga = new VagaComum(1, "shopping", "A-01", "A");
        Assert.True(vaga.EstaDisponivel());

        vaga.Reservar();
        Assert.Equal(StatusVaga.Reservada, vaga.Status);

        vaga.Ocupar();
        Assert.Equal(StatusVaga.Ocupada, vaga.Status);

        vaga.Liberar();
        Assert.True(vaga.EstaDisponivel());
    }

    [Fact]
    public void Operacoes_DevemFalhar_QuandoStatusNaoPermite()
    {
        var ocupada = new VagaPCD(2, "shopping", "A-02", "A", StatusVaga.Ocupada);
        Assert.Contains("não está livre", Assert.Throws<RegraDeNegocioException>(ocupada.Reservar).Message);
        Assert.Contains("está ocupada", Assert.Throws<RegraDeNegocioException>(ocupada.Bloquear).Message);

        var bloqueada = new VagaComum(3, "shopping", "A-03", "A", StatusVaga.Bloqueada);
        Assert.Contains("não pode ser ocupada", Assert.Throws<RegraDeNegocioException>(bloqueada.Ocupar).Message);
        Assert.Contains("está bloqueada", Assert.Throws<RegraDeNegocioException>(bloqueada.Liberar).Message);

        bloqueada.Desbloquear();
        Assert.True(bloqueada.EstaDisponivel());
    }

    [Fact]
    public void EhEspecial_DeveSerFalso_SomenteParaVagaComum()
    {
        Assert.False(new VagaComum(1, "shopping", "A-01", "A").EhEspecial());
        Assert.True(new VagaEletrica(2, "shopping", "C-21", "C").EhEspecial());
    }

    [Theory]
    [InlineData(StatusVaga.Livre, true)]
    [InlineData(StatusVaga.Bloqueada, true)]
    [InlineData(StatusVaga.Ocupada, false)]
    [InlineData(StatusVaga.Reservada, false)]
    public void PodeSerExcluida_DeveAceitarSomenteLivreOuBloqueada(StatusVaga status, bool esperado)
    {
        Assert.Equal(esperado, new VagaComum(1, "shopping", "A", "A", status).PodeSerExcluida());
    }
}
