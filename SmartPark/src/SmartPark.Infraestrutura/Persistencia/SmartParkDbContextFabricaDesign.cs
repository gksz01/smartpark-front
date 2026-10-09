using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SmartPark.Infraestrutura.Persistencia;

/// <summary>Usada só pelo "dotnet ef" para gerar migrações, sem precisar do projeto Web.</summary>
public class SmartParkDbContextFabricaDesign : IDesignTimeDbContextFactory<SmartParkDbContext>
{
    public SmartParkDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<SmartParkDbContext>().UseSqlite("Data Source=smartpark.db").Options);
}
