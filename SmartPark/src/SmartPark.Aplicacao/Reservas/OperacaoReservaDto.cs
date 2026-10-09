namespace SmartPark.Aplicacao.Reservas;

/// <summary>A reserva depois da operação e as notificações criadas pelo Observer.</summary>
public sealed record OperacaoReservaDto(ReservaDto Reserva, IReadOnlyList<string> Notificacoes);
