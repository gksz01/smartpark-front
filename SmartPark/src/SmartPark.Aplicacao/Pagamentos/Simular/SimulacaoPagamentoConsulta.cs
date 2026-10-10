using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Pagamentos.Simular;

/// <summary>Prévia do valor exibida no formulário de pagamento. Nada é gravado e o benefício não é consumido.</summary>
public sealed record SimulacaoPagamentoConsulta(string TenantId, int DuracaoHoras, FormaPagamento Forma, int Parcelas = 1, string? NumeroAtendimento = null);
