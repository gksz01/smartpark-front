namespace SmartPark.Aplicacao.Veiculos;

/// <summary>Campos do formulário de veículo, usados na criação e na alteração.</summary>
public sealed record DadosVeiculo(string Apelido, string Placa, string Modelo, string Cor, string? Unidade = null, string? TagRfid = null);
