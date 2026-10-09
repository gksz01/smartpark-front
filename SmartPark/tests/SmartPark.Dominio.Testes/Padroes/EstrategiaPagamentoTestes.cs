using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.Padroes.Estrategia.Pagamentos;
using SmartPark.Dominio.Testes.Entidades;

namespace SmartPark.Dominio.Testes.Padroes;

public class EstrategiaPagamentoTestes
{
    [Fact]
    public void Pagar_DeveFuncionarComQualquerFormaDoContrato()
    {
        IEstrategiaPagamento[] estrategias = [new PagamentoPix(), new PagamentoCredito(), new PagamentoDebito()];

        var pagamentos = estrategias.Select(estrategia =>
        {
            var pagamento = new Pagamento(1, "shopping", 1, 1, 28, 28, estrategia, codigo: PagamentoTestes.CodigoFixo);
            pagamento.Pagar(); // mesma chamada para todas as formas
            return pagamento;
        }).ToList();

        Assert.Equal([FormaPagamento.Pix, FormaPagamento.Credito, FormaPagamento.Debito], pagamentos.Select(pagamento => pagamento.Forma));
        Assert.Equal(["PIX-A1B2C3", "CRE-A1B2C3", "DEB-A1B2C3"], pagamentos.Select(pagamento => pagamento.Comprovante));
        Assert.All(pagamentos, pagamento => Assert.True(pagamento.EstaAprovado()));
    }

    [Fact]
    public void Cobrar_DeveTerComportamentoProprio_EmCadaEstrategia()
    {
        var pix = new Pagamento(1, "shopping", 1, 1, 28, 28, new PagamentoPix());
        var debito = new Pagamento(2, "shopping", 1, 1, 28, 28, new PagamentoDebito());
        var creditoParcelado = new Pagamento(3, "shopping", 1, 1, 28, 28, new PagamentoCredito(3));

        pix.Pagar();
        debito.Pagar();
        creditoParcelado.Pagar();

        Assert.Equal(28, pix.ValorCobrado);
        Assert.Equal("Pix aprovado instantaneamente", pix.Detalhe);
        Assert.Equal(28, debito.ValorCobrado);
        Assert.Equal("Débito aprovado à vista", debito.Detalhe);
        Assert.Equal(29.4m, creditoParcelado.ValorCobrado); // 28 + 5% de taxa
        Assert.Equal("Crédito em 3x de R$ 9,80", creditoParcelado.Detalhe);
    }

    [Fact]
    public void DefinirEstrategia_DeveMudarOResultado_QuandoTrocadaAntesDePagar()
    {
        var pagamento = new Pagamento(1, "shopping", 1, 1, 28, 28, new PagamentoPix(), codigo: PagamentoTestes.CodigoFixo);
        Assert.Equal(FormaPagamento.Pix, pagamento.Forma);

        pagamento.DefinirEstrategia(new PagamentoCredito(2));
        pagamento.Pagar();

        Assert.Equal(FormaPagamento.Credito, pagamento.Forma);
        Assert.Equal(29.4m, pagamento.ValorCobrado);
        Assert.Equal("CRE-A1B2C3", pagamento.Comprovante);
    }

    [Fact]
    public void DefinirEstrategia_DeveFalhar_QuandoPagamentoJaProcessado()
    {
        var pagamento = new Pagamento(1, "shopping", 1, 1, 28, 28, new PagamentoPix());
        pagamento.Pagar();

        var erro = Assert.Throws<RegraDeNegocioException>(() => pagamento.DefinirEstrategia(new PagamentoDebito()));
        Assert.Contains("já processado", erro.Message);
    }

    [Fact]
    public void PagamentoCredito_DeveSerSemTaxaAVista_ELimitadoA3Parcelas()
    {
        Assert.Equal(new ResultadoPagamento(28, "Crédito à vista"), new PagamentoCredito(1).Cobrar(28));
        Assert.Contains("de 1 a 3 parcelas", Assert.Throws<RegraDeNegocioException>(() => new PagamentoCredito(4)).Message);
        Assert.Contains("de 1 a 3 parcelas", Assert.Throws<RegraDeNegocioException>(() => new PagamentoCredito(0)).Message);
    }

    [Fact]
    public void EstrategiaPagamentoPorForma_DeveCriarAEstrategiaDaForma()
    {
        Assert.IsType<PagamentoPix>(EstrategiaPagamentoPorForma.Criar(FormaPagamento.Pix));
        Assert.Equal(2, Assert.IsType<PagamentoCredito>(EstrategiaPagamentoPorForma.Criar(FormaPagamento.Credito, 2)).Parcelas);
        Assert.IsType<PagamentoDebito>(EstrategiaPagamentoPorForma.Criar(FormaPagamento.Debito));
    }
}
