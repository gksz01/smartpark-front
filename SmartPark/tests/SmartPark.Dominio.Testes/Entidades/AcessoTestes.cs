using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Dominio.Testes.Entidades;

public class AcessoTestes
{
    [Fact]
    public void Liberar_DeveMudarDePendenteParaLiberado_UmaUnicaVez()
    {
        var acesso = new Acesso(1, "shopping", "Marina Costa", "BRA2E19", MetodoAcesso.Lpr, DirecaoAcesso.Entrada, false, new DateTime(2026, 9, 5, 14, 5, 0));
        Assert.Equal(StatusAcesso.Pendente, acesso.Status);

        acesso.Liberar();

        Assert.Equal(StatusAcesso.Liberado, acesso.Status);
        Assert.True(acesso.EhEntrada());
        Assert.Equal("14:05", acesso.HorarioFormatado());
        Assert.Contains("já foi liberado", Assert.Throws<RegraDeNegocioException>(() => acesso.Negar("Teste")).Message);
    }

    [Fact]
    public void Negar_DeveFalhar_QuandoMotivoEmBranco()
    {
        var acesso = new Acesso(3, "shopping", "Bruno Dias", "DFK4J86", MetodoAcesso.Lpr, DirecaoAcesso.Entrada);

        var erro = Assert.Throws<RegraDeNegocioException>(() => acesso.Negar("   "));

        Assert.Equal("Informe o motivo da negação.", erro.Message);
        Assert.Equal(StatusAcesso.Pendente, acesso.Status);
    }

    [Fact]
    public void Negar_DeveRegistrarMotivo_EIdentificarLiberacaoManual()
    {
        var acesso = new Acesso(2, "shopping", "Carlos Nunes", "RF-44310", MetodoAcesso.Rfid, DirecaoAcesso.Saida, true);

        acesso.Negar("Tag expirada");

        Assert.Equal(StatusAcesso.Negado, acesso.Status);
        Assert.Equal("Tag expirada", acesso.MotivoNegacao);
        Assert.True(acesso.EhManual());
    }
}
