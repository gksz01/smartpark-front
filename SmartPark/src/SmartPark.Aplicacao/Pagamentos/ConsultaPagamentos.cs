using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;

namespace SmartPark.Aplicacao.Pagamentos;

/// <summary>Pagamentos do tenant com o veículo e, quando houver, o atendimento e o convênio (usado na lista e após o estorno).</summary>
internal static class ConsultaPagamentos
{
    public static async Task<List<PagamentoDto>> ListarAsync(ISmartParkContexto contexto, string tenantId, int? id, CancellationToken cancellationToken)
    {
        var linhas = await (
                from pagamento in contexto.Pagamentos.AsNoTracking()
                join veiculo in contexto.Veiculos on pagamento.VeiculoId equals veiculo.Id
                join atendimento in contexto.Atendimentos on pagamento.AtendimentoId equals atendimento.Id into atendimentos
                from atendimento in atendimentos.DefaultIfEmpty()
                where pagamento.TenantId == tenantId && (id == null || pagamento.Id == id)
                orderby pagamento.CriadoEm descending, pagamento.Id descending
                select new { pagamento, veiculo, Numero = atendimento != null ? atendimento.Numero : null, Convenio = atendimento != null ? atendimento.Convenio.Nome : null })
            .ToListAsync(cancellationToken);
        return linhas.Select(linha => PagamentoDto.De(linha.pagamento, linha.veiculo, linha.Numero, linha.Convenio)).ToList();
    }
}
