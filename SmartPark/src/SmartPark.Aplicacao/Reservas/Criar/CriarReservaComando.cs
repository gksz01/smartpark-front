namespace SmartPark.Aplicacao.Reservas.Criar;

public sealed record CriarReservaComando(string TenantId, int VeiculoId, int VagaId, DateOnly Data, TimeOnly Hora, int DuracaoHoras);
