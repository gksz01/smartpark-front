namespace SmartPark.Aplicacao.Acessos.Criar;

/// <summary>Liberação manual feita pelo operador na portaria.</summary>
public sealed record CriarAcessoComando(string TenantId, DadosAcesso Dados);
