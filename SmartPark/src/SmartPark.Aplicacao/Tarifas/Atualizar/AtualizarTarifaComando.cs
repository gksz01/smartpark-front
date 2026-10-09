namespace SmartPark.Aplicacao.Tarifas.Atualizar;

public sealed record AtualizarTarifaComando(string TenantId, int Id, DadosTarifa Dados);
