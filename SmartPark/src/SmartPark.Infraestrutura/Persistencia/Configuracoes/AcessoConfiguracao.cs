using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Infraestrutura.Persistencia.Configuracoes;

public class AcessoConfiguracao : IEntityTypeConfiguration<Acesso>
{
    public void Configure(EntityTypeBuilder<Acesso> builder)
    {
        builder.ToTable("Acessos", tabela =>
        {
            tabela.HasCheckConstraint("CK_Acessos_TenantId", Restricoes.TenantValido);
            tabela.HasCheckConstraint("CK_Acessos_Metodo", Restricoes.ValoresDe<MetodoAcesso>("Metodo"));
            tabela.HasCheckConstraint("CK_Acessos_Direcao", Restricoes.ValoresDe<DirecaoAcesso>("Direcao"));
            tabela.HasCheckConstraint("CK_Acessos_Status", Restricoes.ValoresDe<StatusAcesso>("Status"));
        });
        builder.Property(acesso => acesso.TenantId).IsRequired();
        builder.Property(acesso => acesso.Pessoa).IsRequired();
        builder.Property(acesso => acesso.Identificador).IsRequired();
    }
}
