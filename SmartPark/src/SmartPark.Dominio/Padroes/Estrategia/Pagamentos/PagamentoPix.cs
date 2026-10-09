using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Padroes.Estrategia.Pagamentos;

/// <summary>Estratégia concreta: Pix é aprovado na hora, sem taxa.</summary>
public class PagamentoPix : IEstrategiaPagamento
{
    public FormaPagamento Forma => FormaPagamento.Pix;

    public string PrefixoComprovante => "PIX";

    public int Parcelas => 1;

    public ResultadoPagamento Cobrar(decimal valor) => new(valor, "Pix aprovado instantaneamente");
}
