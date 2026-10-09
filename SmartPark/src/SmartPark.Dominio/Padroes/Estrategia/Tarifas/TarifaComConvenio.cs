using SmartPark.Dominio.Entidades;

namespace SmartPark.Dominio.Padroes.Estrategia.Tarifas;

/// <summary>
/// Estratégia concreta: aplica o benefício de um convênio médico (Hospital)
/// sobre uma estratégia base, por exemplo TarifaPorHora.
/// </summary>
public class TarifaComConvenio(IEstrategiaTarifa estrategiaBase, Convenio convenio) : IEstrategiaTarifa
{
    public IEstrategiaTarifa EstrategiaBase { get; } = estrategiaBase;
    public Convenio Convenio { get; } = convenio;

    public decimal Calcular(decimal duracaoHoras) => Convenio.AplicarBeneficio(EstrategiaBase, duracaoHoras);

    public string Descricao() =>
        $"{EstrategiaBase.Descricao()} com convênio {Convenio.Nome} ({Convenio.DescricaoBeneficio()})";
}
