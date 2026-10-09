using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Padroes.Estrategia.Tarifas;

/// <summary>Como uma estratégia de tarifa fica gravada no banco: o tipo e os números.</summary>
public sealed record ConfiguracaoTarifa(TipoEstrategiaTarifa Tipo, decimal Valor, decimal? ValorMaximoDiario);
