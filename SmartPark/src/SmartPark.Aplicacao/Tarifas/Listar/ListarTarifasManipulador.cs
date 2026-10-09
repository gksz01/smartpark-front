using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Tarifas.Listar;

public sealed class ListarTarifasManipulador(ISmartParkContexto contexto)
{
    /// <summary>A tarifa ativa primeiro.</summary>
    public async Task<Resultado<IReadOnlyList<TarifaDto>>> ExecutarAsync(ListarTarifasConsulta consulta, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(consulta.TenantId, Recurso.Cobranca) is { } erro) return Resultado<IReadOnlyList<TarifaDto>>.Falha(erro);

        var tarifas = await contexto.Tarifas.AsNoTracking()
            .Where(tarifa => tarifa.TenantId == consulta.TenantId)
            .OrderByDescending(tarifa => tarifa.Ativa).ThenBy(tarifa => tarifa.Id)
            .ToListAsync(cancellationToken);
        return Resultado<IReadOnlyList<TarifaDto>>.Ok(tarifas.Select(TarifaDto.De).ToList());
    }
}
