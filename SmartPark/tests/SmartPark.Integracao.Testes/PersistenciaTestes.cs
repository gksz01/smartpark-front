using Microsoft.EntityFrameworkCore;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Padroes.Estrategia.Pagamentos;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Integracao.Testes;

/// <summary>Ida e volta do banco: o que é gravado volta com o mesmo comportamento de domínio.</summary>
public sealed class PersistenciaTestes : IDisposable
{
    private readonly BancoDeTeste _banco = new();

    public void Dispose() => _banco.Dispose();

    private async Task GravarAsync(params object[] entidades)
    {
        await using var contexto = _banco.CriarContexto();
        contexto.AddRange(entidades);
        await contexto.SaveChangesAsync();
    }

    [Fact]
    public async Task Vaga_DeveVoltarComoASubclasseDoTipo()
    {
        var eletrica = new VagaEletrica(0, "shopping", "C-21", "C");
        eletrica.Ocupar();
        await GravarAsync(eletrica, new VagaPrioritaria(0, "hospital", "P-01", "Pronto-socorro"));

        await using var contexto = _banco.CriarContexto();
        var lida = await contexto.Vagas.SingleAsync(vaga => vaga.Codigo == "C-21");

        Assert.IsType<VagaEletrica>(lida);
        Assert.Equal(StatusVaga.Ocupada, lida.Status);
        Assert.True(lida.ExcedeuPermanencia(5)); // comportamento da subclasse continua valendo
        Assert.IsType<VagaPrioritaria>(await contexto.Vagas.SingleAsync(vaga => vaga.Codigo == "P-01"));
    }

    [Fact]
    public async Task Tarifa_DeveReconstruirAEstrategiaGravada()
    {
        await GravarAsync(new Tarifa(0, "shopping", "Padrão", new TarifaPorHora(12, 60)));

        await using var contexto = _banco.CriarContexto();
        var lida = await contexto.Tarifas.SingleAsync();

        Assert.IsType<TarifaPorHora>(lida.Estrategia);
        Assert.Equal(60, lida.Calcular(8));
        Assert.Equal("Padrão: R$ 12,00/hora (máx. R$ 60,00/dia)", lida.Descricao());
    }

    [Fact]
    public async Task Tarifa_DeveGravarAEstrategiaBase_QuandoForComConvenio()
    {
        var convenio = new Convenio(0, "hospital", "Saúde Plena", TipoBeneficio.Isencao);
        await GravarAsync(new Tarifa(0, "hospital", "Hospital", new TarifaComConvenio(new TarifaPorHora(10), convenio)));

        await using var contexto = _banco.CriarContexto();
        var lida = await contexto.Tarifas.SingleAsync();

        Assert.IsType<TarifaPorHora>(lida.Estrategia);
        Assert.Equal(30, lida.Calcular(3));
    }

    [Fact]
    public async Task Pagamento_DeveReconstruirAEstrategia_EManterOComprovante()
    {
        var veiculo = new Veiculo(0, "shopping", "BRA2E19", "Jeep Renegade", "Branco", "Família");
        await GravarAsync(veiculo);
        var pagamento = new Pagamento(0, "shopping", veiculo.Id, 4, 48, 48, new PagamentoCredito(3));
        pagamento.Pagar();
        await GravarAsync(pagamento);

        await using var contexto = _banco.CriarContexto();
        var lido = await contexto.Pagamentos.SingleAsync();

        var credito = Assert.IsType<PagamentoCredito>(lido.Estrategia);
        Assert.Equal(3, credito.Parcelas);
        Assert.Equal(50.4m, lido.ValorCobrado);
        Assert.Equal(pagamento.Comprovante, lido.Comprovante);
        lido.Estornar();
        Assert.Equal(StatusPagamento.Estornado, lido.Status);
    }

    [Fact]
    public async Task Atendimento_DeveVoltarComConvenio_ParaValidarElegibilidade()
    {
        var inativo = new Convenio(0, "hospital", "Plano Antigo", TipoBeneficio.Percentual, 30, ativo: false);
        await GravarAsync(new Atendimento(0, "hospital", "ATD-55120", "João Lima", inativo, DateTime.Now.AddHours(-3)));

        await using var contexto = _banco.CriarContexto();
        var lido = await contexto.Atendimentos.Include(atendimento => atendimento.Convenio).SingleAsync();

        Assert.Equal("O convênio Plano Antigo está inativo.", lido.MotivoInelegibilidade(DateTime.Now));
    }

    [Fact]
    public async Task Acesso_DeveManterStatusEMotivoDaNegacao()
    {
        var acesso = new Acesso(0, "company", "Ex-colaborador", "RF-44310", MetodoAcesso.Rfid, DirecaoAcesso.Entrada);
        acesso.Negar("Tag desativada");
        await GravarAsync(acesso);

        await using var contexto = _banco.CriarContexto();
        var lido = await contexto.Acessos.SingleAsync();

        Assert.Equal(StatusAcesso.Negado, lido.Status);
        Assert.Equal("Tag desativada", lido.MotivoNegacao);
    }
}
