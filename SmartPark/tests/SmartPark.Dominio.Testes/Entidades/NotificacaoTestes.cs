using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Testes.Entidades;

public class NotificacaoTestes
{
    [Fact]
    public void Formatar_DeveIncluirHorario_EMarcarComoLida()
    {
        var notificacao = new Notificacao(1, "Vaga ocupada", "A-01 foi ocupada.", TipoNotificacao.Alerta, new DateTime(2026, 9, 5, 14, 32, 0));

        Assert.Equal("[14:32] Vaga ocupada: A-01 foi ocupada.", notificacao.Formatar());
        Assert.True(notificacao.EhAlerta());
        Assert.False(notificacao.Lida);

        notificacao.MarcarComoLida();
        Assert.True(notificacao.Lida);
    }
}
