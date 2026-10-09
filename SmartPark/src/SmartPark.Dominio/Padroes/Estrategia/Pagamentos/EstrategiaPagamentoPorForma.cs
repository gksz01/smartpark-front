using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Padroes.Estrategia.Pagamentos;

/// <summary>
/// Escolhe a estratégia concreta a partir da forma escolhida na tela ou gravada no banco.
/// Taxa, parcelamento e prefixo do comprovante continuam dentro de cada estratégia.
/// </summary>
public static class EstrategiaPagamentoPorForma
{
    public static IEstrategiaPagamento Criar(FormaPagamento forma, int parcelas = 1) => forma switch
    {
        FormaPagamento.Pix => new PagamentoPix(),
        FormaPagamento.Credito => new PagamentoCredito(parcelas),
        _ => new PagamentoDebito(),
    };
}
