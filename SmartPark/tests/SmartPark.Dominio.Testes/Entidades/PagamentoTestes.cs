using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.Padroes.Estrategia.Pagamentos;

namespace SmartPark.Dominio.Testes.Entidades;

public class PagamentoTestes
{
    public static readonly Guid CodigoFixo = Guid.Parse("a1b2c3d4-0000-0000-0000-000000000000");

    [Fact]
    public void Pagar_DeveAprovarEGerarComprovante_EPermitirEstorno()
    {
        var pagamento = new Pagamento(1, "shopping", 1, 1, 28, 28, new PagamentoPix(), codigo: CodigoFixo);

        pagamento.Pagar();

        Assert.True(pagamento.EstaAprovado());
        Assert.Equal("PIX-A1B2C3", pagamento.Comprovante);
        Assert.Equal("R$ 28,00", pagamento.ValorFormatado());

        pagamento.Estornar();
        Assert.Equal(StatusPagamento.Estornado, pagamento.Status);
    }

    [Fact]
    public void Pagar_DeveFalhar_QuandoDuplicadoNegativoOuEstornoSemAprovacao()
    {
        var pagamento = new Pagamento(1, "shopping", 1, 1, 28, 28, new PagamentoCredito());
        Assert.Contains("Apenas pagamentos aprovados", Assert.Throws<RegraDeNegocioException>(pagamento.Estornar).Message);

        pagamento.Pagar();
        Assert.Contains("já foi processado", Assert.Throws<RegraDeNegocioException>(pagamento.Pagar).Message);

        var negativo = new Pagamento(2, "shopping", 1, 1, -5, -5, new PagamentoDebito());
        Assert.Contains("não pode ser negativo", Assert.Throws<RegraDeNegocioException>(negativo.Pagar).Message);
    }

    [Fact]
    public void Pagar_DeveAprovar_QuandoValorZeroDeIsencao()
    {
        var isento = new Pagamento(1, "shopping", 1, 1, 0, 0, new PagamentoPix(), codigo: CodigoFixo);

        isento.Pagar();

        Assert.True(isento.EstaAprovado());
        Assert.Equal(0, isento.ValorCobrado);
        Assert.Equal("PIX-A1B2C3", isento.Comprovante);
    }
}
