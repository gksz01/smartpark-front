using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Padroes.Fabrica.Vagas;

/// <summary>
/// Qual Creator atende cada tipo de vaga escolhido na tela.
/// Só ESCOLHE o Creator; quem cria a vaga continua sendo o CriarVaga() de cada Creator concreto.
/// </summary>
public static class CriadorVagaPorTipo
{
    private static readonly Dictionary<TipoVaga, CriadorVaga> Criadores = new()
    {
        [TipoVaga.Comum] = new CriadorVagaComum(),
        [TipoVaga.PCD] = new CriadorVagaPCD(),
        [TipoVaga.Eletrica] = new CriadorVagaEletrica(),
        [TipoVaga.Nominal] = new CriadorVagaNominal(),
        [TipoVaga.Restrita] = new CriadorVagaRestrita(),
        [TipoVaga.Prioritaria] = new CriadorVagaPrioritaria(),
    };

    public static CriadorVaga Obter(TipoVaga tipo) => Criadores[tipo];
}
