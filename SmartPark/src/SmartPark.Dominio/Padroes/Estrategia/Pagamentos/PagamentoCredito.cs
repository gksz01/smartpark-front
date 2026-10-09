using SmartPark.Dominio.Comum;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Dominio.Padroes.Estrategia.Pagamentos;

/// <summary>Estratégia concreta: crédito à vista sem taxa ou parcelado em até 3x com 5% de taxa.</summary>
public class PagamentoCredito : IEstrategiaPagamento
{
    public const int MaximoParcelas = 3;
    private const decimal TaxaParcelamento = 0.05m;

    public PagamentoCredito(int parcelas = 1)
    {
        if (parcelas is < 1 or > MaximoParcelas)
            throw new RegraDeNegocioException($"O crédito aceita de 1 a {MaximoParcelas} parcelas.");
        Parcelas = parcelas;
    }

    public int Parcelas { get; }

    public FormaPagamento Forma => FormaPagamento.Credito;

    public string PrefixoComprovante => "CRE";

    public ResultadoPagamento Cobrar(decimal valor)
    {
        if (Parcelas == 1) return new(valor, "Crédito à vista");

        var valorCobrado = Math.Round(valor * (1 + TaxaParcelamento), 2, MidpointRounding.AwayFromZero);
        return new(valorCobrado, $"Crédito em {Parcelas}x de {Formatacao.FormatarMoeda(valorCobrado / Parcelas)}");
    }
}
