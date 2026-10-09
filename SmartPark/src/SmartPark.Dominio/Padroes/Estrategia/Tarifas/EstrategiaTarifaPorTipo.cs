using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Dominio.Padroes.Estrategia.Tarifas;

/// <summary>
/// Ponte entre o banco e o padrão Strategy: reconstrói a estratégia gravada (e faz o caminho inverso).
/// Não calcula nada; o cálculo continua dentro de cada estratégia.
/// </summary>
public static class EstrategiaTarifaPorTipo
{
    public static IEstrategiaTarifa Criar(ConfiguracaoTarifa configuracao) => configuracao.Tipo switch
    {
        TipoEstrategiaTarifa.PorHora => new TarifaPorHora(configuracao.Valor, configuracao.ValorMaximoDiario),
        TipoEstrategiaTarifa.Diaria => new TarifaFixaDiaria(configuracao.Valor),
        _ => new TarifaIsenta(),
    };

    public static ConfiguracaoTarifa ObterConfiguracao(IEstrategiaTarifa estrategia) => estrategia switch
    {
        TarifaPorHora porHora => new(TipoEstrategiaTarifa.PorHora, porHora.ValorHora, porHora.ValorMaximoDiario),
        TarifaFixaDiaria diaria => new(TipoEstrategiaTarifa.Diaria, diaria.ValorDiaria, null),
        TarifaIsenta => new(TipoEstrategiaTarifa.Isenta, 0, null),
        // TarifaComConvenio é composta na hora (Hospital + convênio) e não é gravada sozinha
        _ => throw new RegraDeNegocioException("Esta estratégia não pode ser gravada como tarifa independente."),
    };
}
