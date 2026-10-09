namespace SmartPark.Dominio.Padroes.Estrategia.Tarifas;

/// <summary>
/// STRATEGY — Exemplo 1: cálculo de tarifa.
/// Contrato comum a todos os algoritmos de preço. A Tarifa (Context) conhece
/// apenas esta interface e não sabe qual algoritmo concreto está sendo usado.
/// </summary>
public interface IEstrategiaTarifa
{
    decimal Calcular(decimal duracaoHoras);

    string Descricao();
}
