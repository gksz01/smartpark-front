using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.LinhaDeProduto;
using SmartPark.Dominio.Padroes.Fabrica.Vagas;

namespace SmartPark.Dominio.Testes.Padroes;

public class FabricaVagaTestes
{
    [Fact]
    public void CriarVaga_DeveCriarASubclasseDeCadaCreator()
    {
        Assert.IsType<VagaComum>(new CriadorVagaComum().CriarVaga(1, "shopping", "A-01", "A"));
        Assert.IsType<VagaPCD>(new CriadorVagaPCD().CriarVaga(2, "shopping", "A-02", "A"));
        Assert.IsType<VagaEletrica>(new CriadorVagaEletrica().CriarVaga(3, "shopping", "C-21", "C"));
        Assert.IsType<VagaPrioritaria>(new CriadorVagaPrioritaria().CriarVaga(4, "shopping", "H-01", "H"));
        Assert.IsType<VagaNominal>(new CriadorVagaNominal().CriarVaga(5, "shopping", "B-12", "B"));
        Assert.IsType<VagaRestrita>(new CriadorVagaRestrita().CriarVaga(7, "shopping", "D-01", "Diretoria"));
    }

    [Fact]
    public void CriarVaga_DeveNascerComTipoCorreto_EContinuarSendoVaga()
    {
        var vaga = new CriadorVagaPCD().CriarVaga(2, "shopping", "A-02", "A");

        Assert.IsAssignableFrom<Vaga>(vaga);
        Assert.Equal(TipoVaga.PCD, vaga.Tipo);
        Assert.True(vaga.EstaDisponivel());
    }

    [Fact]
    public void Produtos_DevemTerComportamentosDiferentes()
    {
        var comum = new CriadorVagaComum().CriarVaga(1, "shopping", "A-01", "A");
        var eletrica = new CriadorVagaEletrica().CriarVaga(3, "shopping", "C-21", "C");
        var prioritaria = new CriadorVagaPrioritaria().CriarVaga(4, "shopping", "H-01", "H");
        var restrita = new CriadorVagaRestrita().CriarVaga(7, "shopping", "D-01", "Diretoria");

        Assert.Equal("Livre para qualquer veículo", comum.RequisitoDeUso());
        Assert.Equal("Exclusiva para veículos elétricos em recarga", eletrica.RequisitoDeUso());
        Assert.Equal("Exclusiva para pacientes e acompanhantes", prioritaria.RequisitoDeUso());
        Assert.Equal("Exclusiva para credenciais autorizadas", restrita.RequisitoDeUso());
        // 5 horas: sem limite na comum, excede as 4h de recarga da elétrica, dentro das 6h da prioritária.
        Assert.False(comum.ExcedeuPermanencia(5));
        Assert.True(eletrica.ExcedeuPermanencia(5));
        Assert.False(prioritaria.ExcedeuPermanencia(5));
    }

    [Fact]
    public void CadastrarVaga_DeveFuncionarComQualquerCreator()
    {
        var estacionamento = new Estacionamento(1, "shopping", "Estacionamento Central", "Av. das Palmeiras, 450");
        CriadorVaga[] criadores = [new CriadorVagaComum(), new CriadorVagaPCD(), new CriadorVagaEletrica()];

        for (var indice = 0; indice < criadores.Length; indice++)
            criadores[indice].CadastrarVaga(estacionamento, indice + 1, $"A-0{indice + 1}", "A");

        Assert.Equal(3, estacionamento.TotalVagas());
        Assert.Equal([TipoVaga.Comum, TipoVaga.PCD, TipoVaga.Eletrica], estacionamento.Vagas.Select(vaga => vaga.Tipo));
        Assert.Equal("A-03", estacionamento.BuscarVagaLivre(TipoVaga.Eletrica)?.Codigo);
    }

    [Fact]
    public void CriadorVagaPorTipo_DeveTerUmCreatorParaCadaTipo()
    {
        foreach (var tipo in Enum.GetValues<TipoVaga>())
            Assert.Equal(tipo, CriadorVagaPorTipo.Obter(tipo).CriarVaga(1, "shopping", "X", "A").Tipo);
    }

    [Fact]
    public void CriadorVagaPorTipo_DeveAtenderTodosOsTiposDeVagaDosTenants()
    {
        foreach (var tenant in RegistroTenants.Todos)
            foreach (var tipo in tenant.TiposVaga)
                Assert.Equal(tipo, CriadorVagaPorTipo.Obter(tipo).CriarVaga(1, "shopping", "X", "A").Tipo);
    }
}
