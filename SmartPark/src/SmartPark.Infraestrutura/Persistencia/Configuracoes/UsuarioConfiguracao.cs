using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Infraestrutura.Persistencia.Configuracoes;

public class UsuarioConfiguracao : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuarios", tabela =>
        {
            tabela.HasCheckConstraint("CK_Usuarios_TenantId", Restricoes.TenantValido);
            tabela.HasCheckConstraint("CK_Usuarios_Tipo", Restricoes.ValoresDe<TipoPessoa>("Tipo"));
            tabela.HasCheckConstraint("CK_Usuarios_Perfil", Restricoes.ValoresDe<Perfil>("Perfil"));
        });
        builder.Property(usuario => usuario.TenantId).IsRequired();
        builder.Property(usuario => usuario.Nome).IsRequired();
        builder.Property(usuario => usuario.Documento).IsRequired();

        // O mesmo documento não se repete dentro de um tenant
        builder.HasIndex(usuario => new { usuario.TenantId, usuario.Documento }).IsUnique();
    }
}
