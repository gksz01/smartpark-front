using Microsoft.Extensions.DependencyInjection;

namespace SmartPark.Aplicacao;

public static class InjecaoDeDependencia
{
    /// <summary>Registra todos os casos de uso (classes terminadas em Manipulador) desta camada.</summary>
    public static IServiceCollection AdicionarAplicacao(this IServiceCollection servicos)
    {
        var manipuladores = typeof(InjecaoDeDependencia).Assembly.GetTypes()
            .Where(tipo => tipo.IsClass && !tipo.IsAbstract && tipo.Name.EndsWith("Manipulador"));
        foreach (var manipulador in manipuladores) servicos.AddScoped(manipulador);
        return servicos;
    }
}
