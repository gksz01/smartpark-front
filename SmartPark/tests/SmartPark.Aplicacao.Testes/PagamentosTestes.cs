using SmartPark.Aplicacao.Pagamentos.Criar;
using SmartPark.Aplicacao.Pagamentos.Estornar;
using SmartPark.Aplicacao.Pagamentos.Excluir;
using SmartPark.Aplicacao.Pagamentos.Listar;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Testes;

public class PagamentosTestes : CenarioAplicacao
{
    [Fact]
    public async Task CriarAsync_DeveCalcularPelaTarifaAtiva_EAplicarTaxaDoCredito()
    {
        var pagamento = Sucesso(await new CriarPagamentoManipulador(Contexto).ExecutarAsync(
            new CriarPagamentoComando("shopping", IdVeiculo("shopping", "SPK1A23"), 4, FormaPagamento.Credito, Parcelas: 3)));

        Assert.Equal(48, pagamento.Valor); // 4h × R$ 12
        Assert.Equal(50.4m, pagamento.ValorCobrado); // + 5% do parcelamento
        Assert.Equal("Crédito em 3x de R$ 16,80", pagamento.Detalhe);
        Assert.StartsWith("CRE-", pagamento.Comprovante);
    }

    [Fact]
    public async Task CriarAsync_DeveAplicarConvenio_EConsumirOBeneficio()
    {
        var comando = new CriarPagamentoComando("hospital", IdVeiculo("hospital", "HSP2C34"), 3, FormaPagamento.Pix, NumeroAtendimento: "atd-48291");

        var pagamento = Sucesso(await new CriarPagamentoManipulador(Contexto).ExecutarAsync(comando));

        Assert.Equal(30, pagamento.ValorTarifa);
        Assert.Equal(0, pagamento.Valor); // Saúde Plena: isenção (TarifaComConvenio)
        Assert.Equal("Saúde Plena", pagamento.Convenio);
        Assert.Equal("O benefício deste atendimento já foi utilizado.", Falha(await new CriarPagamentoManipulador(Contexto).ExecutarAsync(comando)));
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoTenantSemConvenioInformaAtendimento()
    {
        var comando = new CriarPagamentoComando("shopping", IdVeiculo("shopping", "SPK1A23"), 2, FormaPagamento.Pix, NumeroAtendimento: "ATD-48291");

        Assert.Equal("O módulo Convênio médico não está disponível para Shopping Center Aurora.", Falha(await new CriarPagamentoManipulador(Contexto).ExecutarAsync(comando)));
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoParcelasAcimaDoLimite()
    {
        var comando = new CriarPagamentoComando("shopping", IdVeiculo("shopping", "SPK1A23"), 2, FormaPagamento.Credito, Parcelas: 4);

        Assert.Equal("O crédito aceita de 1 a 3 parcelas.", Falha(await new CriarPagamentoManipulador(Contexto).ExecutarAsync(comando)));
    }

    [Fact]
    public async Task EstornarEExcluir_DevemSeguirAsRegrasDoPagamento()
    {
        var pagamentos = Sucesso(await new ListarPagamentosManipulador(Contexto).ExecutarAsync(new("shopping")));
        var aprovado = pagamentos.First(pagamento => pagamento.Status == StatusPagamento.Aprovado);
        Assert.Equal("Somente pagamentos estornados podem ser excluídos. Estorne o pagamento antes.",
            Falha(await new ExcluirPagamentoManipulador(Contexto).ExecutarAsync(new("shopping", aprovado.Id))));

        var estornado = Sucesso(await new EstornarPagamentoManipulador(Contexto).ExecutarAsync(new("shopping", aprovado.Id)));

        Assert.Equal(StatusPagamento.Estornado, estornado.Status);
        Assert.Equal("Apenas pagamentos aprovados podem ser estornados.", Falha(await new EstornarPagamentoManipulador(Contexto).ExecutarAsync(new("shopping", aprovado.Id))));
        Sucesso(await new ExcluirPagamentoManipulador(Contexto).ExecutarAsync(new("shopping", aprovado.Id)));
    }

    [Fact]
    public async Task ListarAsync_DeveTrazerAtendimentoEConvenio_DoPagamentoComConvenio()
    {
        var pagamentos = Sucesso(await new ListarPagamentosManipulador(Contexto).ExecutarAsync(new("hospital")));

        var comConvenio = Assert.Single(pagamentos, pagamento => pagamento.NumeroAtendimento != null);
        Assert.Equal("ATD-90442", comConvenio.NumeroAtendimento);
        Assert.Equal("Saúde Plena", comConvenio.Convenio);
    }
}

public class SimulacoesTestes : CenarioAplicacao
{
    [Fact]
    public async Task SimularPagamentoAsync_DeveCalcularComConvenio_SemConsumirBeneficio()
    {
        var consulta = new SmartPark.Aplicacao.Pagamentos.Simular.SimulacaoPagamentoConsulta("hospital", 3, FormaPagamento.Pix, NumeroAtendimento: "ATD-71305");

        var simulacao = Sucesso(await new SmartPark.Aplicacao.Pagamentos.Simular.SimularPagamentoManipulador(Contexto).ExecutarAsync(consulta));

        Assert.Equal(30, simulacao.ValorTarifa);
        Assert.Equal(15, simulacao.Valor); // VidaCare: 50% de desconto
        Assert.Equal("Desconto de 50%", simulacao.Beneficio);
        await using var leitura = CriarContexto();
        Assert.False(leitura.Atendimentos.Single(atendimento => atendimento.Numero == "ATD-71305").BeneficioAplicado);
    }

    [Fact]
    public async Task SimularPagamentoAsync_DeveIncluirTaxaDoParcelamento()
    {
        var consulta = new SmartPark.Aplicacao.Pagamentos.Simular.SimulacaoPagamentoConsulta("shopping", 4, FormaPagamento.Credito, Parcelas: 3);

        var simulacao = Sucesso(await new SmartPark.Aplicacao.Pagamentos.Simular.SimularPagamentoManipulador(Contexto).ExecutarAsync(consulta));

        Assert.Equal(48, simulacao.Valor);
        Assert.Equal(50.4m, simulacao.ValorCobrado);
    }

    [Fact]
    public async Task EstimarReservaAsync_DeveUsarATarifaAtiva()
    {
        var estimativa = Sucesso(await new SmartPark.Aplicacao.Reservas.Estimar.EstimarReservaManipulador(Contexto).ExecutarAsync(new("shopping", 8)));

        Assert.Equal("Tarifa Aurora", estimativa.Tarifa);
        Assert.Equal(60, estimativa.Valor); // 8h × R$ 12 = 96, limitado ao teto de R$ 60
    }
}
