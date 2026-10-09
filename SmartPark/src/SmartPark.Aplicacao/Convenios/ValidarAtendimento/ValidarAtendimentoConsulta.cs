namespace SmartPark.Aplicacao.Convenios.ValidarAtendimento;

/// <summary>Só verifica a elegibilidade; o benefício é consumido no pagamento.</summary>
public sealed record ValidarAtendimentoConsulta(string TenantId, string Numero);
