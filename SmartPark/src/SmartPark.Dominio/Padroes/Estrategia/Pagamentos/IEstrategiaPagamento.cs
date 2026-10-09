using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Padroes.Estrategia.Pagamentos;

/// <summary>
/// STRATEGY — Exemplo 2: cobrança do pagamento.
/// Contrato comum a todas as formas de pagamento. O Pagamento (Context) conhece
/// apenas esta interface e não sabe qual forma concreta está sendo usada.
/// </summary>
public interface IEstrategiaPagamento
{
    FormaPagamento Forma { get; }

    string PrefixoComprovante { get; }

    /// <summary>Quantidade de parcelas; 1 nas formas à vista.</summary>
    int Parcelas { get; }

    ResultadoPagamento Cobrar(decimal valor);
}
