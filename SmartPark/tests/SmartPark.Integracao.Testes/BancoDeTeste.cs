using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SmartPark.Infraestrutura.Persistencia;

namespace SmartPark.Integracao.Testes;

/// <summary>
/// Banco SQLite em memória com as migrações aplicadas. Cada teste cria o seu,
/// e o banco existe enquanto a conexão estiver aberta.
/// </summary>
public sealed class BancoDeTeste : IDisposable
{
    private readonly SqliteConnection _conexao = new("Data Source=:memory:;Foreign Keys=True");

    public BancoDeTeste()
    {
        _conexao.Open();
        using var contexto = CriarContexto();
        contexto.Database.Migrate();
    }

    /// <summary>Um contexto novo a cada chamada, para ler do banco e não do cache do EF.</summary>
    public SmartParkDbContext CriarContexto() =>
        new(new DbContextOptionsBuilder<SmartParkDbContext>().UseSqlite(_conexao).Options);

    public void Dispose() => _conexao.Dispose();
}
