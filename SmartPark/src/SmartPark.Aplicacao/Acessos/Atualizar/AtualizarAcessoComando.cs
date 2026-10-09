namespace SmartPark.Aplicacao.Acessos.Atualizar;

public sealed record AtualizarAcessoComando(string TenantId, int Id, DadosAcesso Dados);
