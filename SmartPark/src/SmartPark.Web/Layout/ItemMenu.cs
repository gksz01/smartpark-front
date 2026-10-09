using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Web.Layout;

/// <summary>Uma entrada do menu e o que ela exige (permissão do perfil e recurso do tenant).</summary>
public sealed record ItemMenu(string Titulo, string Rota, Permissao Permissao, Recurso? RecursoNecessario = null)
{
    /// <summary>Lista central do menu: as telas usam as mesmas exigências no PaginaProtegida.</summary>
    public static IReadOnlyList<ItemMenu> Todos { get; } =
    [
        new("Veículos", "/veiculos", Permissao.Veiculos),
        new("Reservas", "/reservas", Permissao.Portal, Recurso.Reserva),
        new("Pagamentos", "/pagamentos", Permissao.Portal, Recurso.Cobranca),
        new("Vagas", "/vagas", Permissao.Vagas),
        new("Entradas e saídas", "/acessos", Permissao.Acessos),
        new("Pessoas", "/pessoas", Permissao.Usuarios),
        new("Tarifas", "/tarifas", Permissao.Configuracao, Recurso.Cobranca),
        new("Convênios", "/convenios", Permissao.ConvenioMedico, Recurso.ConvenioMedico),
    ];
}
