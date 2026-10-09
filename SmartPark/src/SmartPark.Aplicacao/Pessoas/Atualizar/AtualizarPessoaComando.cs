namespace SmartPark.Aplicacao.Pessoas.Atualizar;

public sealed record AtualizarPessoaComando(string TenantId, int Id, DadosPessoa Dados);
