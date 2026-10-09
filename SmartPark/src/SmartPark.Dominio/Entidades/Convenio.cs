using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Dominio.Entidades;

/// <summary>
/// Convênio médico que concede benefício no estacionamento do Hospital.
/// ValorBeneficio é o percentual (Percentual) ou a quantidade de horas (HorasGratis).
/// </summary>
public class Convenio
{
    public int Id { get; private set; }
    public string TenantId { get; private set; }
    public string Nome { get; private set; }
    public TipoBeneficio TipoBeneficio { get; private set; }
    public int ValorBeneficio { get; private set; }
    public bool Ativo { get; private set; }

    public Convenio(int id, string tenantId, string nome, TipoBeneficio tipoBeneficio, int valorBeneficio = 0, bool ativo = true)
    {
        ValidarBeneficio(tipoBeneficio, valorBeneficio);
        Id = id;
        TenantId = tenantId;
        Nome = nome;
        TipoBeneficio = tipoBeneficio;
        ValorBeneficio = valorBeneficio;
        Ativo = ativo;
    }

    // Usado pelo EF Core ao ler do banco.
    private Convenio() : this(0, "", "", TipoBeneficio.Isencao) { }

    /// <summary>Valor final do estacionamento depois do benefício.</summary>
    public decimal AplicarBeneficio(IEstrategiaTarifa tarifa, decimal duracaoHoras)
    {
        if (!Ativo) return tarifa.Calcular(duracaoHoras);
        return TipoBeneficio switch
        {
            TipoBeneficio.Isencao => 0,
            TipoBeneficio.Percentual => tarifa.Calcular(duracaoHoras) * (1 - ValorBeneficio / 100m),
            _ => tarifa.Calcular(Math.Max(0, duracaoHoras - ValorBeneficio)),
        };
    }

    public string DescricaoBeneficio() => TipoBeneficio switch
    {
        TipoBeneficio.Isencao => "Isenção de 100%",
        TipoBeneficio.Percentual => $"Desconto de {ValorBeneficio}%",
        _ => $"{ValorBeneficio} horas gratuitas",
    };

    private static void ValidarBeneficio(TipoBeneficio tipo, int valor)
    {
        if (tipo == TipoBeneficio.Percentual && valor is < 1 or > 100)
            throw new RegraDeNegocioException("O percentual de desconto deve estar entre 1 e 100.");
        if (tipo == TipoBeneficio.HorasGratis && valor < 1)
            throw new RegraDeNegocioException("Informe a quantidade de horas grátis (número inteiro maior que zero).");
    }
}
