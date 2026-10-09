using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Pagamentos.Criar;

/// <summary>O valor NUNCA vem da tela: é calculado pela tarifa ativa (e pelo convênio, quando houver).</summary>
public sealed record CriarPagamentoComando(string TenantId, int VeiculoId, int DuracaoHoras, FormaPagamento Forma, int Parcelas = 1,
    int? ReservaId = null, string? NumeroAtendimento = null);
