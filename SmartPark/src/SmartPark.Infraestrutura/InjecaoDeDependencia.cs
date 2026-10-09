using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartPark.Infraestrutura.Persistencia;
using SmartPark.Infraestrutura.Seed;

namespace SmartPark.Infraestrutura;

public static class InjecaoDeDependencia
{
    public static IServiceCollection AdicionarInfraestrutura(this IServiceCollection servicos, IConfiguration configuracao)
    {
        var conexao = configuracao.GetConnectionString("SmartPark") ?? "Data Source=smartpark.db;Foreign Keys=True";
        servicos.AddDbContext<SmartParkDbContext>(opcoes => opcoes.UseSqlite(conexao));
        servicos.AddScoped<PopuladorBanco>();
        return servicos;
    }

    /// <summary>Aplica as migrações pendentes e popula as tabelas vazias com os dados de demonstração.</summary>
    public static async Task InicializarBancoAsync(this IServiceProvider provedor, CancellationToken cancellationToken = default)
    {
        using var escopo = provedor.CreateScope();
        await escopo.ServiceProvider.GetRequiredService<SmartParkDbContext>().Database.MigrateAsync(cancellationToken);
        await escopo.ServiceProvider.GetRequiredService<PopuladorBanco>().PopularTabelasVaziasAsync(cancellationToken);
    }
}
