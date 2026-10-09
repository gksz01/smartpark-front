namespace SmartPark.Aplicacao.Reservas.Atualizar;

/// <summary>Altera data, horário e duração; a estimativa é recalculada com a tarifa ativa.</summary>
public sealed record AtualizarReservaComando(string TenantId, int Id, DateOnly Data, TimeOnly Hora, int DuracaoHoras);
