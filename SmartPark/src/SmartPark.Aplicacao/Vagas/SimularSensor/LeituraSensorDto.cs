namespace SmartPark.Aplicacao.Vagas.SimularSensor;

/// <summary>A vaga já atualizada pelo Observer e as notificações geradas na leitura.</summary>
public sealed record LeituraSensorDto(VagaDto Vaga, IReadOnlyList<string> Notificacoes);
