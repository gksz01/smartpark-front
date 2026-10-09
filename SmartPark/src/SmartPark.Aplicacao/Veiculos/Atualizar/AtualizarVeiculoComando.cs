namespace SmartPark.Aplicacao.Veiculos.Atualizar;

public sealed record AtualizarVeiculoComando(string TenantId, int Id, DadosVeiculo Dados);
