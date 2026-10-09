namespace SmartPark.Aplicacao.Vagas.Atualizar;

public sealed record AtualizarVagaComando(string TenantId, int Id, DadosVaga Dados);
