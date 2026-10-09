namespace SmartPark.Aplicacao.Convenios.Atualizar;

public sealed record AtualizarConvenioComando(string TenantId, int Id, DadosConvenio Dados);
