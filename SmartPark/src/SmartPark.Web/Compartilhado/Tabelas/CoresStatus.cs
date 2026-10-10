using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Web.Compartilhado.Tabelas;

/// <summary>Tom da Etiqueta de cada status, igual ao da versão React, em um só lugar para todas as telas.</summary>
public static class CoresStatus
{
    public static string De(StatusVaga status) => status switch
    {
        StatusVaga.Livre => "success",
        StatusVaga.Ocupada => "info",
        StatusVaga.Reservada => "warning",
        _ => "danger",
    };

    public static string De(StatusAcesso status) => status switch
    {
        StatusAcesso.Liberado => "success",
        StatusAcesso.Pendente => "warning",
        _ => "danger",
    };

    public static string De(StatusReserva status) => status switch
    {
        StatusReserva.Pendente => "warning",
        StatusReserva.Confirmada => "success",
        StatusReserva.Concluida => "info",
        _ => "neutral",
    };

    public static string De(StatusPagamento status) => status switch
    {
        StatusPagamento.Pendente => "warning",
        StatusPagamento.Aprovado => "success",
        _ => "neutral",
    };

    public static string DeAtivo(bool ativo) => ativo ? "success" : "neutral";
}
