using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Infraestrutura.Persistencia.Configuracoes;

public class TarifaConfiguracao : IEntityTypeConfiguration<Tarifa>
{
    public void Configure(EntityTypeBuilder<Tarifa> builder)
    {
        builder.ToTable("Tarifas", tabela =>
        {
            tabela.HasCheckConstraint("CK_Tarifas_TenantId", Restricoes.TenantValido);
            tabela.HasCheckConstraint("CK_Tarifas_TipoEstrategia", Restricoes.ValoresDe<TipoEstrategiaTarifa>("TipoEstrategia"));
            tabela.HasCheckConstraint("CK_Tarifas_Valor", "Valor >= 0");
        });
        builder.Property(tarifa => tarifa.TenantId).IsRequired();
        builder.Property(tarifa => tarifa.Nome).IsRequired();

        // A Strategy não é gravada como objeto: o banco guarda TipoEstrategia e valores, e a Tarifa a reconstrói.
        builder.Ignore(tarifa => tarifa.Estrategia);

        // No máximo UMA tarifa ativa por tenant: o próprio banco recusa uma segunda
        builder.HasIndex(tarifa => tarifa.TenantId).IsUnique().HasFilter("Ativa = 1");
    }
}
