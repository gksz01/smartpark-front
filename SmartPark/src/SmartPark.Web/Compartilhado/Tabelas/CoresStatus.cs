using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Web.Compartilhado.Tabelas;

/// <summary>Cor da Etiqueta de cada status, em um só lugar para todas as telas.</summary>
public static class CoresStatus
{
    public static string De(StatusVaga status) => status switch
    {
        StatusVaga.Livre => "verde",
        StatusVaga.Ocupada => "vermelho",
        StatusVaga.Reservada => "azul",
        _ => "cinza",
    };

    public static string De(StatusAcesso status) => status switch
    {
        StatusAcesso.Liberado => "verde",
        StatusAcesso.Negado => "vermelho",
        _ => "amarelo",
    };

    public static string De(StatusReserva status) => status switch
    {
        StatusReserva.Confirmada => "azul",
        StatusReserva.Concluida => "verde",
        StatusReserva.Pendente => "amarelo",
        _ => "cinza",
    };

    public static string De(StatusPagamento status) => status switch
    {
        StatusPagamento.Aprovado => "verde",
        StatusPagamento.Pendente => "amarelo",
        _ => "cinza",
    };

    public static string DeAtivo(bool ativo) => ativo ? "verde" : "cinza";
}
