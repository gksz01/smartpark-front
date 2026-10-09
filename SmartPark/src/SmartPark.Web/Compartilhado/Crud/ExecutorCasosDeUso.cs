namespace SmartPark.Web.Compartilhado.Crud;

/// <summary>
/// Executa um caso de uso em um escopo novo de injeção de dependência.
/// No Blazor Server a conexão dura muito tempo; um escopo por operação dá a cada
/// caso de uso um DbContext novo, como aconteceria em uma requisição HTTP.
/// </summary>
public sealed class ExecutorCasosDeUso(IServiceScopeFactory fabricaDeEscopos)
{
    public async Task<TResultado> ExecutarAsync<TManipulador, TResultado>(Func<TManipulador, Task<TResultado>> casoDeUso)
        where TManipulador : notnull
    {
        await using var escopo = fabricaDeEscopos.CreateAsyncScope();
        return await casoDeUso(escopo.ServiceProvider.GetRequiredService<TManipulador>());
    }
}
