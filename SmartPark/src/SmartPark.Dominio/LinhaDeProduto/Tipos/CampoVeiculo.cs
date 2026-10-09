namespace SmartPark.Dominio.LinhaDeProduto.Tipos;

/// <summary>Campo extra do veículo que só aparece em alguns tenants (ex.: Tag RFID na Empresa).</summary>
public sealed record CampoVeiculo(string Chave, string Rotulo, string Exemplo);
