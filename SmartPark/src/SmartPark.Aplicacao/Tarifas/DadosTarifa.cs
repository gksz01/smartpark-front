using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Tarifas;

/// <summary>Campos do formulário de tarifa, usados na criação e na alteração.</summary>
public sealed record DadosTarifa(string Nome, TipoEstrategiaTarifa TipoEstrategia, decimal Valor, decimal? ValorMaximoDiario, bool Ativa);
