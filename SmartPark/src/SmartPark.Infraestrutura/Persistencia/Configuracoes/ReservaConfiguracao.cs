using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Infraestrutura.Persistencia.Configuracoes;

public class ReservaConfiguracao : IEntityTypeConfiguration<Reserva>
{
    public void Configure(EntityTypeBuilder<Reserva> builder)
    {
        builder.ToTable("Reservas", tabela =>
        {
            tabela.HasCheckConstraint("CK_Reservas_TenantId", Restricoes.TenantValido);
            tabela.HasCheckConstraint("CK_Reservas_Status", Restricoes.ValoresDe<StatusReserva>("Status"));
            tabela.HasCheckConstraint("CK_Reservas_DuracaoHoras", "DuracaoHoras > 0");
        });
        builder.Property(reserva => reserva.TenantId).IsRequired();

        builder.HasOne<Veiculo>().WithMany().HasForeignKey(reserva => reserva.VeiculoId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Vaga>().WithMany().HasForeignKey(reserva => reserva.VagaId).OnDelete(DeleteBehavior.Restrict);

        // Uma vaga não pode ter duas reservas confirmadas ao mesmo tempo: o próprio banco recusa
        builder.HasIndex(reserva => reserva.VagaId).IsUnique().HasFilter($"Status = '{StatusReserva.Confirmada}'");
    }
}
