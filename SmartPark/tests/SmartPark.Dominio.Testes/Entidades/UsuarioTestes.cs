using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Testes.Entidades;

public class UsuarioTestes
{
    [Fact]
    public void PossuiPermissao_DeveUsarMatrizDoPerfil_QuandoUsuarioAtivo()
    {
        var admin = new Usuario(1, "hospital", "Marina Costa", "123", Perfil.Administrador, TipoPessoa.Funcionario);

        Assert.True(admin.PossuiPermissao(Permissao.Configuracao));
        Assert.False(admin.PossuiPermissao(Permissao.Portal));
    }

    [Fact]
    public void PossuiPermissao_DeveNegar_QuandoUsuarioDesativado()
    {
        var admin = new Usuario(1, "hospital", "Marina Costa", "123", Perfil.Administrador, TipoPessoa.Funcionario);

        admin.Desativar();

        Assert.False(admin.PossuiPermissao(Permissao.Configuracao));
    }

    [Fact]
    public void EhVisitante_DeveIdentificarTipoDaPessoa_EPrimeiroNome()
    {
        var visitante = new Usuario(2, "condominium", "Rafael Lima", "456", Perfil.Visitante, TipoPessoa.Visitante);
        var acompanhante = new Usuario(3, "hospital", "Ana Souza", "789", Perfil.Visitante, TipoPessoa.Acompanhante);

        Assert.True(visitante.EhVisitante());
        Assert.Equal("Rafael", visitante.PrimeiroNome());
        Assert.True(acompanhante.EhPacienteOuAcompanhante());
    }
}
