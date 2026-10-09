using SmartPark.Aplicacao.Tarifas;
using SmartPark.Aplicacao.Tarifas.Atualizar;
using SmartPark.Aplicacao.Tarifas.Criar;
using SmartPark.Aplicacao.Tarifas.Excluir;
using SmartPark.Aplicacao.Tarifas.Listar;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Testes;

public class TarifasTestes : CenarioAplicacao
{
    [Fact]
    public async Task ListarAsync_DeveFalhar_QuandoTenantNaoTemCobranca()
    {
        var erro = Falha(await new ListarTarifasManipulador(Contexto).ExecutarAsync(new("condominium")));

        Assert.Equal("O módulo Cobrança individual não está disponível para Residencial Horizonte.", erro);
    }

    [Fact]
    public async Task CriarAsync_DeveDesativarAAnterior_QuandoNovaTarifaNasceAtiva()
    {
        var criada = Sucesso(await new CriarTarifaManipulador(Contexto).ExecutarAsync(new("shopping", new DadosTarifa("Nova", TipoEstrategiaTarifa.Diaria, 35, null, Ativa: true))));

        var tarifas = Sucesso(await new ListarTarifasManipulador(Contexto).ExecutarAsync(new("shopping")));
        var ativa = Assert.Single(tarifas, tarifa => tarifa.Ativa);
        Assert.Equal(criada.Id, ativa.Id);
        Assert.Equal("R$ 35,00/dia", ativa.Descricao);
    }

    [Fact]
    public async Task AtualizarAsync_DeveTrocarAEstrategia_EAtivarATarifa()
    {
        var diaria = Contexto.Tarifas.Single(tarifa => tarifa.TenantId == "shopping" && tarifa.Nome == "Diária promocional").Id;

        var atualizada = Sucesso(await new AtualizarTarifaManipulador(Contexto).ExecutarAsync(new("shopping", diaria, new DadosTarifa("Promo por hora", TipoEstrategiaTarifa.PorHora, 8, 40, Ativa: true))));

        Assert.Equal("R$ 8,00/hora (máx. R$ 40,00/dia)", atualizada.Descricao);
        await using var leitura = CriarContexto();
        Assert.Equal(diaria, leitura.Tarifas.Single(tarifa => tarifa.TenantId == "shopping" && tarifa.Ativa).Id);
    }

    [Theory]
    [InlineData(TipoEstrategiaTarifa.Diaria, 40.0, 80.0, "O teto diário só se aplica à tarifa por hora.")]
    [InlineData(TipoEstrategiaTarifa.PorHora, 12.0, 10.0, "O teto diário deve ser maior ou igual ao valor da hora.")]
    [InlineData(TipoEstrategiaTarifa.PorHora, 0.0, null, "Informe um valor maior que zero.")]
    public async Task CriarAsync_DeveValidarValores(TipoEstrategiaTarifa tipo, double valor, double? teto, string esperado)
    {
        var dados = new DadosTarifa("Teste", tipo, (decimal)valor, (decimal?)teto, Ativa: false);

        Assert.Equal(esperado, Falha(await new CriarTarifaManipulador(Contexto).ExecutarAsync(new("shopping", dados))));
    }

    [Fact]
    public async Task ExcluirAsync_DeveFalhar_QuandoTarifaAtiva()
    {
        var ativa = Contexto.Tarifas.Single(tarifa => tarifa.TenantId == "shopping" && tarifa.Ativa);

        var erro = Falha(await new ExcluirTarifaManipulador(Contexto).ExecutarAsync(new("shopping", ativa.Id)));

        Assert.Equal($"A tarifa {ativa.Nome} está ativa. Ative outra tarifa ou desative esta antes de excluir.", erro);
    }
}
