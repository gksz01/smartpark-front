using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using SmartPark.Dominio.Entidades;

namespace SmartPark.Aplicacao.Comum;

/// <summary>
/// O que os casos de uso precisam do banco. Implementado pelo SmartParkDbContext (Infraestrutura),
/// assim a Aplicação usa o EF Core sem depender do SQLite nem de um repositório genérico.
/// </summary>
public interface ISmartParkContexto
{
    DbSet<Veiculo> Veiculos { get; }
    DbSet<Usuario> Usuarios { get; }
    DbSet<Vaga> Vagas { get; }
    DbSet<Acesso> Acessos { get; }
    DbSet<Tarifa> Tarifas { get; }
    DbSet<Reserva> Reservas { get; }
    DbSet<Convenio> Convenios { get; }
    DbSet<Atendimento> Atendimentos { get; }
    DbSet<Pagamento> Pagamentos { get; }

    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
