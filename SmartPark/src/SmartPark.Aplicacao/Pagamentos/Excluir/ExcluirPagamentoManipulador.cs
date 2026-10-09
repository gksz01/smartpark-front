using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Pagamentos.Excluir;

/// <summary>Só pagamentos estornados podem ser excluídos.</summary>
public sealed class ExcluirPagamentoManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado> ExecutarAsync(ExcluirPagamentoComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.Cobranca) is { } erro) return Resultado.Falha(erro);

        var pagamento = await contexto.Pagamentos.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (pagamento is null) return Resultado.Falha("Pagamento não encontrado.");
        if (pagamento.Status != StatusPagamento.Estornado)
            return Resultado.Falha("Somente pagamentos estornados podem ser excluídos. Estorne o pagamento antes.");

        contexto.Pagamentos.Remove(pagamento);
        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado.Ok();
    }
}
