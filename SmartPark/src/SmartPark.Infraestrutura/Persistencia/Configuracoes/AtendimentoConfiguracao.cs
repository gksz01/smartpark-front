using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartPark.Dominio.Entidades;

namespace SmartPark.Infraestrutura.Persistencia.Configuracoes;

public class AtendimentoConfiguracao : IEntityTypeConfiguration<Atendimento>
{
    public void Configure(EntityTypeBuilder<Atendimento> builder)
    {
        builder.ToTable("Atendimentos", tabela => tabela.HasCheckConstraint("CK_Atendimentos_TenantId", Restricoes.TenantValido));
        builder.Property(atendimento => atendimento.TenantId).IsRequired();
        builder.Property(atendimento => atendimento.Numero).IsRequired();
        builder.Property(atendimento => atendimento.Paciente).IsRequired();

        builder.HasOne(atendimento => atendimento.Convenio).WithMany()
            .HasForeignKey(atendimento => atendimento.ConvenioId).OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(atendimento => new { atendimento.TenantId, atendimento.Numero }).IsUnique();
    }
}
