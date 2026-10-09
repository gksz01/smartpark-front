using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SmartPark.Compartilhado;
using SmartPark.Infraestrutura.Persistencia;
using SmartPark.Infraestrutura.Seed;

namespace SmartPark.Aplicacao.Testes;

/// <summary>
/// Banco SQLite em memória, migrado e com os dados de demonstração do seed.
/// Cada classe de teste cria um cenário por teste (xUnit cria uma instância por teste).
/// </summary>
public abstract class CenarioAplicacao : IDisposable
{
    private readonly SqliteConnection _conexao = new("Data Source=:memory:;Foreign Keys=True");

    protected CenarioAplicacao()
    {
        _conexao.Open();
        Contexto = CriarContexto();
        Contexto.Database.Migrate();
        new PopuladorBanco(Contexto).PopularTabelasVaziasAsync().GetAwaiter().GetResult();
        Contexto.ChangeTracker.Clear();
    }

    /// <summary>Contexto usado pelos manipuladores no teste.</summary>
    protected SmartParkDbContext Contexto { get; }

    /// <summary>Contexto novo, para conferir o que realmente foi gravado no banco.</summary>
    protected SmartParkDbContext CriarContexto() => new(new DbContextOptionsBuilder<SmartParkDbContext>().UseSqlite(_conexao).Options);

    protected static T Sucesso<T>(Resultado<T> resultado)
    {
        Assert.True(resultado.Sucesso, resultado.Erro);
        return resultado.Dados!;
    }

    protected static void Sucesso(Resultado resultado) => Assert.True(resultado.Sucesso, resultado.Erro);

    protected static string Falha<T>(Resultado<T> resultado)
    {
        Assert.False(resultado.Sucesso);
        return resultado.Erro!;
    }

    protected static string Falha(Resultado resultado)
    {
        Assert.False(resultado.Sucesso);
        return resultado.Erro!;
    }

    protected int IdVeiculo(string tenant, string placa) => Contexto.Veiculos.Single(veiculo => veiculo.TenantId == tenant && veiculo.Placa == placa).Id;

    protected int IdVaga(string tenant, string codigo) => Contexto.Vagas.Single(vaga => vaga.TenantId == tenant && vaga.Codigo == codigo).Id;

    public void Dispose()
    {
        Contexto.Dispose();
        _conexao.Dispose();
        GC.SuppressFinalize(this);
    }
}
