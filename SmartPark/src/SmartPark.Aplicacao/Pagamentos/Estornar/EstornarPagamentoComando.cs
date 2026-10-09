namespace SmartPark.Aplicacao.Pagamentos.Estornar;

/// <summary>Estorno pelo domínio. O benefício do convênio NÃO é devolvido.</summary>
public sealed record EstornarPagamentoComando(string TenantId, int Id);
