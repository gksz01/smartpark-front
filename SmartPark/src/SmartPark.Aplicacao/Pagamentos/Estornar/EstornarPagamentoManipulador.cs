using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Aplicacao.Pagamentos.Estornar;

public sealed class EstornarPagamentoManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<PagamentoDto>> ExecutarAsync(EstornarPagamentoComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.Cobranca) is { } erro) return Resultado<PagamentoDto>.Falha(erro);

        var pagamento = await contexto.Pagamentos.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (pagamento is null) return Resultado<PagamentoDto>.Falha("Pagamento não encontrado.");

        try
        {
            pagamento.Estornar(); // só pagamentos aprovados
        }
        catch (RegraDeNegocioException falha)
        {
            return Resultado<PagamentoDto>.Falha(falha.Message);
        }

        await contexto.SaveChangesAsync(cancellationToken);
        var atualizado = await ConsultaPagamentos.ListarAsync(contexto, comando.TenantId, pagamento.Id, cancellationToken);
        return Resultado<PagamentoDto>.Ok(atualizado.Single());
    }
}
