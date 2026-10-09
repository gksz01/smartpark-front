using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Infraestrutura.Persistencia;

/// <summary>Acesso ao banco SQLite. O mapeamento de cada entidade fica em Configuracoes/.</summary>
public class SmartParkDbContext(DbContextOptions<SmartParkDbContext> opcoes) : DbContext(opcoes), ISmartParkContexto
{
    public DbSet<Veiculo> Veiculos => Set<Veiculo>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Vaga> Vagas => Set<Vaga>();
    public DbSet<Acesso> Acessos => Set<Acesso>();
    public DbSet<Tarifa> Tarifas => Set<Tarifa>();
    public DbSet<Reserva> Reservas => Set<Reserva>();
    public DbSet<Convenio> Convenios => Set<Convenio>();
    public DbSet<Atendimento> Atendimentos => Set<Atendimento>();
    public DbSet<Pagamento> Pagamentos => Set<Pagamento>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SmartParkDbContext).Assembly);

    protected override void ConfigureConventions(ModelConfigurationBuilder configuracao)
    {
        // Enums gravados pelo nome ("Livre", "Pix"...), legíveis no banco e nas restrições CHECK.
        configuracao.Properties<TipoVaga>().HaveConversion<string>();
        configuracao.Properties<StatusVaga>().HaveConversion<string>();
        configuracao.Properties<StatusReserva>().HaveConversion<string>();
        configuracao.Properties<StatusPagamento>().HaveConversion<string>();
        configuracao.Properties<FormaPagamento>().HaveConversion<string>();
        configuracao.Properties<StatusAcesso>().HaveConversion<string>();
        configuracao.Properties<DirecaoAcesso>().HaveConversion<string>();
        configuracao.Properties<MetodoAcesso>().HaveConversion<string>();
        configuracao.Properties<TipoBeneficio>().HaveConversion<string>();
        configuracao.Properties<TipoEstrategiaTarifa>().HaveConversion<string>();
        configuracao.Properties<TipoPessoa>().HaveConversion<string>();
        configuracao.Properties<Perfil>().HaveConversion<string>();

        // O SQLite não tem tipo decimal: gravar como REAL permite comparar e ordenar no próprio banco.
        configuracao.Properties<decimal>().HaveConversion<double>();
    }
}
