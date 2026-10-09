using SmartPark.Dominio.Enumeradores;
using SmartPark.Web.Compartilhado.Sessao;

namespace SmartPark.Web.Layout;

/// <summary>Uma entrada do menu e o que ela exige (permissão do perfil e recurso do tenant).</summary>
public sealed record ItemMenu(string Titulo, string Rota, string Icone, Permissao Permissao, Recurso? RecursoNecessario = null)
{
    /// <summary>Navegação inferior do portal (motorista, morador, funcionário, visitante).</summary>
    public static IReadOnlyList<ItemMenu> Portal { get; } =
    [
        new("Veículos", "/veiculos", "Car", Permissao.Veiculos),
        new("Reservar", "/reservas", "TicketCheck", Permissao.Portal, Recurso.Reserva),
        new("Pagar", "/pagamentos", "CreditCard", Permissao.Portal, Recurso.Cobranca),
    ];

    /// <summary>Menu lateral da área administrativa (operador, administrador, manobrista).</summary>
    public static IReadOnlyList<ItemMenu> Administracao { get; } =
    [
        new("Veículos", "/veiculos", "Car", Permissao.Veiculos),
        new("Vagas e setores", "/vagas", "CircleParking", Permissao.Vagas),
        new("Entradas e saídas", "/acessos", "Activity", Permissao.Acessos),
        new("Pessoas", "/pessoas", "UsersRound", Permissao.Usuarios),
        new("Tarifas", "/tarifas", "CircleDollarSign", Permissao.Configuracao, Recurso.Cobranca),
        new("Convênios", "/convenios", "HeartHandshake", Permissao.ConvenioMedico, Recurso.ConvenioMedico),
    ];

    /// <summary>Quem tem acesso ao portal usa a navegação do portal; os demais, o menu administrativo.</summary>
    public static bool UsaPortal(SessaoUsuario sessao) => sessao.PodeAcessar(Permissao.Portal);

    public static IEnumerable<ItemMenu> Disponiveis(SessaoUsuario sessao) =>
        (UsaPortal(sessao) ? Portal : Administracao).Where(item => sessao.PodeAcessar(item.Permissao, item.RecursoNecessario));

    /// <summary>Primeira tela depois de entrar: operador e manobrista começam pelas entradas e saídas.</summary>
    public static string RotaInicial(SessaoUsuario sessao)
    {
        var disponiveis = Disponiveis(sessao).ToList();
        if (sessao.Perfil is Perfil.Operador or Perfil.Manobrista && disponiveis.Any(item => item.Rota == "/acessos")) return "/acessos";
        return disponiveis.FirstOrDefault()?.Rota ?? "/";
    }
}
