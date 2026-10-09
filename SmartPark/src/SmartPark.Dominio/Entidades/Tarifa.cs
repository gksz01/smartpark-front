using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Dominio.Entidades;

/// <summary>
/// STRATEGY — Context do exemplo de tarifa.
/// A Tarifa não decide como o preço é calculado: delega para a IEstrategiaTarifa.
/// Trocar a estratégia muda o algoritmo sem alterar esta classe.
/// </summary>
public class Tarifa
{
    private IEstrategiaTarifa? _estrategia;

    public int Id { get; private set; }
    public string TenantId { get; private set; }
    public string Nome { get; private set; }
    public bool Ativa { get; private set; }

    // Como a estratégia fica gravada no banco (ver EstrategiaTarifaPorTipo).
    public TipoEstrategiaTarifa TipoEstrategia { get; private set; }
    public decimal Valor { get; private set; }
    public decimal? ValorMaximoDiario { get; private set; }

    public Tarifa(int id, string tenantId, string nome, IEstrategiaTarifa estrategia, bool ativa = false)
    {
        Id = id;
        TenantId = tenantId;
        Nome = nome;
        Ativa = ativa;
        DefinirEstrategia(estrategia);
    }

    // Usado pelo EF Core ao ler do banco; a estratégia é reconstruída no primeiro uso.
    private Tarifa()
    {
        TenantId = Nome = "";
    }

    public IEstrategiaTarifa Estrategia =>
        _estrategia ??= EstrategiaTarifaPorTipo.Criar(new ConfiguracaoTarifa(TipoEstrategia, Valor, ValorMaximoDiario));

    public void DefinirEstrategia(IEstrategiaTarifa estrategia)
    {
        _estrategia = estrategia;

        // TarifaComConvenio é montada na hora do cálculo: o banco guarda só a estratégia base.
        var gravavel = estrategia is TarifaComConvenio comConvenio ? comConvenio.EstrategiaBase : estrategia;
        var configuracao = EstrategiaTarifaPorTipo.ObterConfiguracao(gravavel);
        TipoEstrategia = configuracao.Tipo;
        Valor = configuracao.Valor;
        ValorMaximoDiario = configuracao.ValorMaximoDiario;
    }

    public void Renomear(string nome) => Nome = nome;

    public void Ativar() => Ativa = true;

    public void Desativar() => Ativa = false;

    public decimal Calcular(decimal duracaoHoras) => Estrategia.Calcular(duracaoHoras);

    public string Descricao() => $"{Nome}: {Estrategia.Descricao()}";
}
