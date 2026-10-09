using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartPark.Dominio.Entidades;

namespace SmartPark.Infraestrutura.Persistencia.Configuracoes;

public class VeiculoConfiguracao : IEntityTypeConfiguration<Veiculo>
{
    public void Configure(EntityTypeBuilder<Veiculo> builder)
    {
        builder.ToTable("Veiculos", tabela => tabela.HasCheckConstraint("CK_Veiculos_TenantId", Restricoes.TenantValido));
        builder.Property(veiculo => veiculo.TenantId).IsRequired();
        builder.Property(veiculo => veiculo.Placa).IsRequired();
        builder.Property(veiculo => veiculo.Modelo).IsRequired();
        builder.Property(veiculo => veiculo.Cor).IsRequired();
        builder.Property(veiculo => veiculo.Apelido).IsRequired();

        // A mesma placa não se repete dentro de um tenant
        builder.HasIndex(veiculo => new { veiculo.TenantId, veiculo.Placa }).IsUnique();
    }
}
