using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Dominio.Entidades;

namespace SmartPark.Aplicacao.Tarifas;

/// <summary>Salvar uma tarifa (nova ou alterada) garantindo no máximo uma ativa por tenant.</summary>
internal static class AtivacaoTarifa
{
    public static async Task SalvarAsync(ISmartParkContexto contexto, Tarifa tarifa, CancellationToken cancellationToken)
    {
        // Desativar a anterior ANTES de gravar a nova: o índice único do banco
        // recusaria duas ativas, mesmo que por um instante. Tudo na mesma transação.
        await using var transacao = await contexto.Database.BeginTransactionAsync(cancellationToken);
        if (tarifa.Ativa)
        {
            await contexto.Tarifas
                .Where(item => item.TenantId == tarifa.TenantId && item.Ativa && item.Id != tarifa.Id)
                .ExecuteUpdateAsync(item => item.SetProperty(outra => outra.Ativa, false), cancellationToken);
        }
        await contexto.SaveChangesAsync(cancellationToken);
        await transacao.CommitAsync(cancellationToken);
    }
}
