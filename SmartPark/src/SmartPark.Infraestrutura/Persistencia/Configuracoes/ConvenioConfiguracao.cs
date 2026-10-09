using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Infraestrutura.Persistencia.Configuracoes;

public class ConvenioConfiguracao : IEntityTypeConfiguration<Convenio>
{
    public void Configure(EntityTypeBuilder<Convenio> builder)
    {
        builder.ToTable("Convenios", tabela =>
        {
            tabela.HasCheckConstraint("CK_Convenios_TenantId", Restricoes.TenantValido);
            tabela.HasCheckConstraint("CK_Convenios_TipoBeneficio", Restricoes.ValoresDe<TipoBeneficio>("TipoBeneficio"));
            tabela.HasCheckConstraint("CK_Convenios_ValorBeneficio", "ValorBeneficio >= 0");
        });
        builder.Property(convenio => convenio.TenantId).IsRequired();
        builder.Property(convenio => convenio.Nome).IsRequired();

        builder.HasIndex(convenio => new { convenio.TenantId, convenio.Nome }).IsUnique();
    }
}
