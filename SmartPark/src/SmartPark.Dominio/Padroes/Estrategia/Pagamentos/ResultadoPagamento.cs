namespace SmartPark.Dominio.Padroes.Estrategia.Pagamentos;

/// <summary>O que cada estratégia devolve depois de cobrar o valor.</summary>
public sealed record ResultadoPagamento(decimal ValorCobrado, string Detalhe);
