using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Infraestrutura.Persistencia.Configuracoes;

public class PagamentoConfiguracao : IEntityTypeConfiguration<Pagamento>
{
    public void Configure(EntityTypeBuilder<Pagamento> builder)
    {
        builder.ToTable("Pagamentos", tabela =>
        {
            tabela.HasCheckConstraint("CK_Pagamentos_TenantId", Restricoes.TenantValido);
            tabela.HasCheckConstraint("CK_Pagamentos_Forma", Restricoes.ValoresDe<FormaPagamento>("Forma"));
            tabela.HasCheckConstraint("CK_Pagamentos_Status", Restricoes.ValoresDe<StatusPagamento>("Status"));
            tabela.HasCheckConstraint("CK_Pagamentos_DuracaoHoras", "DuracaoHoras > 0");
            tabela.HasCheckConstraint("CK_Pagamentos_Valor", "Valor >= 0");
        });
        builder.Property(pagamento => pagamento.TenantId).IsRequired();
        builder.Property(pagamento => pagamento.Comprovante).IsRequired();

        // A Strategy não é gravada como objeto: o banco guarda Forma e Parcelas, e o Pagamento a reconstrói.
        builder.Ignore(pagamento => pagamento.Estrategia);

        builder.HasOne<Veiculo>().WithMany().HasForeignKey(pagamento => pagamento.VeiculoId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Reserva>().WithMany().HasForeignKey(pagamento => pagamento.ReservaId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Atendimento>().WithMany().HasForeignKey(pagamento => pagamento.AtendimentoId).OnDelete(DeleteBehavior.Restrict);

        // Um atendimento só pode gerar um pagamento: o próprio banco recusa o segundo
        builder.HasIndex(pagamento => pagamento.AtendimentoId).IsUnique().HasFilter("AtendimentoId IS NOT NULL");
    }
}
