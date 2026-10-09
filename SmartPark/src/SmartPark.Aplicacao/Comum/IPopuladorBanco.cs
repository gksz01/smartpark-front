namespace SmartPark.Aplicacao.Comum;

/// <summary>Dados de demonstração do protótipo. Implementado na Infraestrutura (PopuladorBanco).</summary>
public interface IPopuladorBanco
{
    Task ResetarAsync(CancellationToken cancellationToken = default);
}
