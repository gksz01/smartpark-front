using Microsoft.EntityFrameworkCore;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;
using SmartPark.Infraestrutura.Seed;

namespace SmartPark.Integracao.Testes;

public sealed class PopuladorBancoTestes : IDisposable
{
    private readonly BancoDeTeste _banco = new();

    public void Dispose() => _banco.Dispose();

    [Fact]
    public async Task PopularTabelasVaziasAsync_DevePopularAsNoveTabelas_QuandoBancoVazio()
    {
        await using var contexto = _banco.CriarContexto();

        var populadas = await new PopuladorBanco(contexto).PopularTabelasVaziasAsync();

        Assert.Equal(["Veiculos", "Usuarios", "Vagas", "Acessos", "Tarifas", "Reservas", "Convenios", "Pagamentos"], populadas);
        Assert.Equal(7, await contexto.Veiculos.CountAsync());
        Assert.Equal(9, await contexto.Usuarios.CountAsync());
        Assert.Equal(23, await contexto.Vagas.CountAsync());
        Assert.Equal(18, await contexto.Acessos.CountAsync());
        Assert.Equal(5, await contexto.Tarifas.CountAsync());
        Assert.Equal(3, await contexto.Reservas.CountAsync());
        Assert.Equal(5, await contexto.Convenios.CountAsync());
        Assert.Equal(6, await contexto.Atendimentos.CountAsync());
        Assert.Equal(5, await contexto.Pagamentos.CountAsync());
    }

    [Fact]
    public async Task PopularTabelasVaziasAsync_NaoDeveDuplicar_QuandoTabelasJaTemDados()
    {
        await using var contexto = _banco.CriarContexto();
        var populador = new PopuladorBanco(contexto);
        await populador.PopularTabelasVaziasAsync();

        var populadas = await populador.PopularTabelasVaziasAsync();

        Assert.Empty(populadas);
        Assert.Equal(7, await contexto.Veiculos.CountAsync());
    }

    [Fact]
    public async Task ResetarAsync_DeveRestaurarDadosIniciais_EReiniciarOsIds()
    {
        await using (var contexto = _banco.CriarContexto())
        {
            var populador = new PopuladorBanco(contexto);
            await populador.PopularTabelasVaziasAsync();
            contexto.Veiculos.Add(new Veiculo(0, "shopping", "ABC1234", "Gol", "Prata", "Extra"));
            await contexto.SaveChangesAsync();

            await populador.ResetarAsync();
        }

        await using var novoContexto = _banco.CriarContexto();
        Assert.Equal(7, await novoContexto.Veiculos.CountAsync());
        Assert.Equal(1, await novoContexto.Veiculos.MinAsync(veiculo => veiculo.Id));
    }

    [Fact]
    public async Task PopularTabelasVaziasAsync_DeveUsarOsPadroesDoDominio()
    {
        await using (var contexto = _banco.CriarContexto()) await new PopuladorBanco(contexto).PopularTabelasVaziasAsync();
        await using var leitura = _banco.CriarContexto();

        // Factory Method da variante: a tarifa ativa do Shopping é por hora, R$ 12 com teto de R$ 60
        var tarifaShopping = await leitura.Tarifas.SingleAsync(tarifa => tarifa.TenantId == "shopping" && tarifa.Ativa);
        Assert.Equal(new ConfiguracaoTarifa(TipoEstrategiaTarifa.PorHora, 12, 60), EstrategiaTarifaPorTipo.ObterConfiguracao(tarifaShopping.Estrategia));

        // TarifaComConvenio: o pagamento do atendimento com isenção sai por R$ 0,00
        var pagamentoIsento = await leitura.Pagamentos.SingleAsync(pagamento => pagamento.AtendimentoId != null);
        Assert.Equal(0, pagamentoIsento.Valor);
        Assert.Equal(StatusPagamento.Aprovado, pagamentoIsento.Status);

        // Strategy de pagamento: crédito em 3x tem 5% de taxa sobre os R$ 48 da tarifa
        var credito = await leitura.Pagamentos.SingleAsync(pagamento => pagamento.Forma == FormaPagamento.Credito);
        Assert.Equal(50.4m, credito.ValorCobrado);
        Assert.StartsWith("CRE-", credito.Comprovante);
    }
}
