namespace SmartPark.Aplicacao.Pagamentos.Simular;

public sealed record SimulacaoPagamentoDto(string Tarifa, decimal ValorTarifa, string? Convenio, string? Beneficio, decimal Valor, decimal ValorCobrado, string Detalhe);
