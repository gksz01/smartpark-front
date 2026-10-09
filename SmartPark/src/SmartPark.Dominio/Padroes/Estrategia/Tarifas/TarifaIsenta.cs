namespace SmartPark.Dominio.Padroes.Estrategia.Tarifas;

/// <summary>Estratégia concreta: sem cobrança (tenants sem o recurso Cobranca, como Condomínio e Empresa).</summary>
public class TarifaIsenta : IEstrategiaTarifa
{
    public decimal Calcular(decimal duracaoHoras) => 0;

    public string Descricao() => "Isento de cobrança";
}
