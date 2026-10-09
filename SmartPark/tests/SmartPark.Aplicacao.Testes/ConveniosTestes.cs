using SmartPark.Aplicacao.Convenios;
using SmartPark.Aplicacao.Convenios.Criar;
using SmartPark.Aplicacao.Convenios.Excluir;
using SmartPark.Aplicacao.Convenios.Listar;
using SmartPark.Aplicacao.Convenios.ValidarAtendimento;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Testes;

public class ConveniosTestes : CenarioAplicacao
{
    [Fact]
    public async Task ListarAsync_DeveContarOsAtendimentosDeCadaConvenio()
    {
        var convenios = Sucesso(await new ListarConveniosManipulador(Contexto).ExecutarAsync(new("hospital")));

        Assert.Equal(2, convenios.Single(convenio => convenio.Nome == "Saúde Plena").QuantidadeAtendimentos);
        Assert.Equal("Desconto de 50%", convenios.Single(convenio => convenio.Nome == "VidaCare").Beneficio);
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoPercentualInvalido()
    {
        var erro = Falha(await new CriarConvenioManipulador(Contexto).ExecutarAsync(new("hospital", new DadosConvenio("Novo", TipoBeneficio.Percentual, 150))));

        Assert.Equal("O percentual de desconto deve estar entre 1 e 100.", erro);
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoTenantNaoTemConvenioMedico()
    {
        var erro = Falha(await new CriarConvenioManipulador(Contexto).ExecutarAsync(new("shopping", new DadosConvenio("Novo", TipoBeneficio.Isencao, 0))));

        Assert.Equal("O módulo Convênio médico não está disponível para Shopping Center Aurora.", erro);
    }

    [Fact]
    public async Task ExcluirAsync_DeveFalhar_QuandoConvenioTemAtendimentos_EExcluirQuandoNaoTem()
    {
        var saudePlena = Contexto.Convenios.Single(convenio => convenio.Nome == "Saúde Plena").Id;
        var medSul = Contexto.Convenios.Single(convenio => convenio.Nome == "MedSul").Id;

        Assert.StartsWith("O convênio Saúde Plena possui 2 atendimento(s)", Falha(await new ExcluirConvenioManipulador(Contexto).ExecutarAsync(new("hospital", saudePlena))));
        Sucesso(await new ExcluirConvenioManipulador(Contexto).ExecutarAsync(new("hospital", medSul)));
    }

    [Theory]
    [InlineData("atd-48291", true, "")]
    [InlineData("ATD-55120", false, "O convênio Plano Antigo está inativo.")]
    [InlineData("ATD-30017", false, "O atendimento tem mais de 24 horas.")]
    [InlineData("ATD-90442", false, "O benefício deste atendimento já foi utilizado.")]
    public async Task ValidarAtendimentoAsync_DeveUsarAsRegrasDoAtendimento(string numero, bool elegivel, string motivo)
    {
        var resultado = Sucesso(await new ValidarAtendimentoManipulador(Contexto).ExecutarAsync(new("hospital", numero)));

        Assert.Equal(elegivel, resultado.Elegivel);
        Assert.Equal(motivo, resultado.Motivo);
    }

    [Fact]
    public async Task ValidarAtendimentoAsync_DeveFalhar_QuandoAtendimentoNaoExiste()
    {
        Assert.Equal("Atendimento não localizado.", Falha(await new ValidarAtendimentoManipulador(Contexto).ExecutarAsync(new("hospital", "ATD-00000"))));
    }
}
