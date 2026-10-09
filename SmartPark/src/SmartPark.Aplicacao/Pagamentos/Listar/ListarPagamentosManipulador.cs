using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Pagamentos.Listar;

public sealed class ListarPagamentosManipulador(ISmartParkContexto contexto)
{
    /// <summary>Histórico de pagamentos, mais recentes primeiro.</summary>
    public async Task<Resultado<IReadOnlyList<PagamentoDto>>> ExecutarAsync(ListarPagamentosConsulta consulta, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(consulta.TenantId, Recurso.Cobranca) is { } erro) return Resultado<IReadOnlyList<PagamentoDto>>.Falha(erro);

        return Resultado<IReadOnlyList<PagamentoDto>>.Ok(await ConsultaPagamentos.ListarAsync(contexto, consulta.TenantId, null, cancellationToken));
    }
}
