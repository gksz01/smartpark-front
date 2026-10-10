using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Tarifas;

/// <summary>
/// Descricao e Simulacao3h vêm da própria Strategy, por meio da Tarifa
/// (ex.: "R$ 12,00/hora (máx. R$ 60,00/dia)" e o valor de 3 horas).
/// </summary>
public sealed record TarifaDto(int Id, string Nome, TipoEstrategiaTarifa TipoEstrategia, decimal Valor, decimal? ValorMaximoDiario, bool Ativa, string Descricao, decimal Simulacao3h)
{
    public static TarifaDto De(Tarifa tarifa) => new(tarifa.Id, tarifa.Nome, tarifa.TipoEstrategia, tarifa.Valor, tarifa.ValorMaximoDiario,
        tarifa.Ativa, tarifa.Estrategia.Descricao(), tarifa.Calcular(3));
}
