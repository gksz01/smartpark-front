using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Padroes.Estrategia.Pagamentos;

/// <summary>Estratégia concreta: débito é aprovado na hora, sem taxa, sempre à vista.</summary>
public class PagamentoDebito : IEstrategiaPagamento
{
    public FormaPagamento Forma => FormaPagamento.Debito;

    public string PrefixoComprovante => "DEB";

    public int Parcelas => 1;

    public ResultadoPagamento Cobrar(decimal valor) => new(valor, "Débito aprovado à vista");
}
