using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Tarifas;

public static class TarifaValidador
{
    public static string? Validar(DadosTarifa dados)
    {
        if (string.IsNullOrWhiteSpace(dados.Nome)) return "Informe o campo Nome.";
        // A tarifa isenta não cobra valor; as demais precisam de valor positivo
        if (dados.TipoEstrategia != TipoEstrategiaTarifa.Isenta && dados.Valor <= 0) return "Informe um valor maior que zero.";
        if (dados.ValorMaximoDiario is decimal teto)
        {
            if (dados.TipoEstrategia != TipoEstrategiaTarifa.PorHora) return "O teto diário só se aplica à tarifa por hora.";
            if (teto < dados.Valor) return "O teto diário deve ser maior ou igual ao valor da hora.";
        }
        return null;
    }
}
