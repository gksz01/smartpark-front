using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Web.Compartilhado.Tabelas;

/// <summary>Tom da Etiqueta de cada status, em um só lugar para todas as telas.</summary>
public static class CoresStatus
{
    public static string De(StatusVaga status) => status switch
    {
        StatusVaga.Livre => "success",
        StatusVaga.Ocupada => "danger",
        StatusVaga.Reservada => "info",
        _ => "neutral",
    };

    public static string De(StatusAcesso status) => status switch
    {
        StatusAcesso.Liberado => "success",
        StatusAcesso.Negado => "danger",
        _ => "warning",
    };

    public static string De(StatusReserva status) => status switch
    {
        StatusReserva.Confirmada => "info",
        StatusReserva.Concluida => "success",
        StatusReserva.Pendente => "warning",
        _ => "neutral",
    };

    public static string De(StatusPagamento status) => status switch
    {
        StatusPagamento.Aprovado => "success",
        StatusPagamento.Pendente => "warning",
        _ => "neutral",
    };

    public static string DeAtivo(bool ativo) => ativo ? "success" : "neutral";
}
