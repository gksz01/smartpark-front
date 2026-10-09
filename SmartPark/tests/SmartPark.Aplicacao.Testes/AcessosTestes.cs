using SmartPark.Aplicacao.Acessos;
using SmartPark.Aplicacao.Acessos.Atualizar;
using SmartPark.Aplicacao.Acessos.Criar;
using SmartPark.Aplicacao.Acessos.Excluir;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Testes;

public class AcessosTestes : CenarioAplicacao
{
    [Fact]
    public async Task CriarAsync_DeveUsarOMetodoDeAcessoDoTenant_EMarcarComoManual()
    {
        var criado = Sucesso(await new CriarAcessoManipulador(Contexto).ExecutarAsync(new("company", new DadosAcesso("Visitante", "rf-123", DirecaoAcesso.Entrada, StatusAcesso.Liberado))));

        Assert.Equal(MetodoAcesso.Rfid, criado.Metodo);
        Assert.Equal("RF-123", criado.Identificador);
        Assert.True(criado.Manual);
        Assert.Equal(StatusAcesso.Liberado, criado.Status);
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoNegaSemMotivo()
    {
        var erro = Falha(await new CriarAcessoManipulador(Contexto).ExecutarAsync(new("shopping", new DadosAcesso("Bruno", "ABC1234", DirecaoAcesso.Entrada, StatusAcesso.Negado))));

        Assert.Equal("Informe o motivo da negação.", erro);
    }

    [Fact]
    public async Task AtualizarAsync_NaoDeveVoltarParaPendente_QuandoAcessoJaDecidido()
    {
        var liberado = Contexto.Acessos.First(acesso => acesso.TenantId == "shopping" && acesso.Status == StatusAcesso.Liberado);

        var erro = Falha(await new AtualizarAcessoManipulador(Contexto).ExecutarAsync(new("shopping", liberado.Id, new DadosAcesso(liberado.Pessoa, liberado.Identificador, liberado.Direcao, StatusAcesso.Pendente))));

        Assert.Equal("Este acesso já foi liberado e não pode voltar para Pendente.", erro);
    }

    [Fact]
    public async Task AtualizarAsync_DeveNegarAcessoPendente_ComMotivo()
    {
        var pendente = Contexto.Acessos.First(acesso => acesso.TenantId == "shopping" && acesso.Status == StatusAcesso.Pendente);

        var negado = Sucesso(await new AtualizarAcessoManipulador(Contexto).ExecutarAsync(new("shopping", pendente.Id, new DadosAcesso(pendente.Pessoa, pendente.Identificador, pendente.Direcao, StatusAcesso.Negado, "Sem cadastro"))));

        Assert.Equal(StatusAcesso.Negado, negado.Status);
        Assert.Equal("Sem cadastro", negado.MotivoNegacao);
    }

    [Fact]
    public async Task ExcluirAsync_DeveFalhar_QuandoAcessoEDeOutroTenant()
    {
        var doShopping = Contexto.Acessos.First(acesso => acesso.TenantId == "shopping").Id;

        Assert.Equal("Acesso não encontrado.", Falha(await new ExcluirAcessoManipulador(Contexto).ExecutarAsync(new("company", doShopping))));
    }
}
