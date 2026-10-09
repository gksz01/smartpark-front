using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Infraestrutura.Persistencia.Configuracoes;

public class VagaConfiguracao : IEntityTypeConfiguration<Vaga>
{
    public void Configure(EntityTypeBuilder<Vaga> builder)
    {
        builder.ToTable("Vagas", tabela =>
        {
            tabela.HasCheckConstraint("CK_Vagas_TenantId", Restricoes.TenantValido);
            tabela.HasCheckConstraint("CK_Vagas_Status", Restricoes.ValoresDe<StatusVaga>("Status"));
        });
        builder.Property(vaga => vaga.TenantId).IsRequired();
        builder.Property(vaga => vaga.Codigo).IsRequired();
        builder.Property(vaga => vaga.Setor).IsRequired();

        // Todas as vagas ficam em uma tabela; a coluna Tipo diz qual subclasse (produto do
        // Factory Method) o EF deve criar ao ler, para cada vaga manter o seu comportamento.
        builder.HasDiscriminator(vaga => vaga.Tipo)
            .HasValue<VagaComum>(TipoVaga.Comum)
            .HasValue<VagaPCD>(TipoVaga.PCD)
            .HasValue<VagaEletrica>(TipoVaga.Eletrica)
            .HasValue<VagaNominal>(TipoVaga.Nominal)
            .HasValue<VagaRestrita>(TipoVaga.Restrita)
            .HasValue<VagaPrioritaria>(TipoVaga.Prioritaria);

        // O mesmo código não se repete dentro de um tenant
        builder.HasIndex(vaga => new { vaga.TenantId, vaga.Codigo }).IsUnique();
    }
}
