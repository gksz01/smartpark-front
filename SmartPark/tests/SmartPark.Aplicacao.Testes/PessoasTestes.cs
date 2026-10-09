using SmartPark.Aplicacao.Pessoas;
using SmartPark.Aplicacao.Pessoas.Atualizar;
using SmartPark.Aplicacao.Pessoas.Criar;
using SmartPark.Aplicacao.Pessoas.Excluir;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Testes;

public class PessoasTestes : CenarioAplicacao
{
    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoTipoNaoPermitidoNoTenant()
    {
        var erro = Falha(await new CriarPessoaManipulador(Contexto).ExecutarAsync(new("shopping", new DadosPessoa("Ana", "111", TipoPessoa.Paciente, Perfil.Motorista))));

        Assert.Equal("Tipo de pessoa não permitido em Shopping Center Aurora. Use: Motorista, Funcionário.", erro);
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoPerfilNaoPermitidoNoTenant()
    {
        var erro = Falha(await new CriarPessoaManipulador(Contexto).ExecutarAsync(new("hospital", new DadosPessoa("Ana", "111", TipoPessoa.Paciente, Perfil.Manobrista))));

        Assert.StartsWith("Perfil não permitido em Hospital Santa Clara.", erro);
    }

    [Fact]
    public async Task CriarAsync_DeveFalhar_QuandoDocumentoJaExisteNoTenant()
    {
        var erro = Falha(await new CriarPessoaManipulador(Contexto).ExecutarAsync(new("shopping", new DadosPessoa("Outra", "123.456.789-01", TipoPessoa.Motorista, Perfil.Motorista))));

        Assert.Equal("Já existe uma pessoa com o documento 123.456.789-01 neste cliente.", erro);
    }

    [Fact]
    public async Task CriarAtualizarExcluir_DeveFuncionar_ComDadosValidos()
    {
        var criada = Sucesso(await new CriarPessoaManipulador(Contexto).ExecutarAsync(new("hospital", new DadosPessoa("Ana Lima", "111", TipoPessoa.Paciente, Perfil.Motorista))));

        var atualizada = Sucesso(await new AtualizarPessoaManipulador(Contexto).ExecutarAsync(new("hospital", criada.Id, new DadosPessoa("Ana Lima", "111", TipoPessoa.Acompanhante, Perfil.Visitante, Ativo: false))));
        Assert.Equal(TipoPessoa.Acompanhante, atualizada.Tipo);
        Assert.False(atualizada.Ativo);

        Sucesso(await new ExcluirPessoaManipulador(Contexto).ExecutarAsync(new("hospital", criada.Id)));
    }
}
