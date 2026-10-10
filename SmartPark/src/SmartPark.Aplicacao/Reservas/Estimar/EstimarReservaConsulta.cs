namespace SmartPark.Aplicacao.Reservas.Estimar;

/// <summary>Prévia da estimativa exibida no formulário, antes de confirmar a reserva.</summary>
public sealed record EstimarReservaConsulta(string TenantId, int DuracaoHoras);
