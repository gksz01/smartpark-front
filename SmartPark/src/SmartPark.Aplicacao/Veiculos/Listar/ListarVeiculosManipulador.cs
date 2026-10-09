using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;

namespace SmartPark.Aplicacao.Veiculos.Listar;

public sealed class ListarVeiculosManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<IReadOnlyList<VeiculoDto>>> ExecutarAsync(ListarVeiculosConsulta consulta, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(consulta.TenantId) is { } erro) return Resultado<IReadOnlyList<VeiculoDto>>.Falha(erro);

        var veiculos = await contexto.Veiculos.AsNoTracking()
            .Where(veiculo => veiculo.TenantId == consulta.TenantId)
            .OrderBy(veiculo => veiculo.Id)
            .ToListAsync(cancellationToken);
        return Resultado<IReadOnlyList<VeiculoDto>>.Ok(veiculos.Select(VeiculoDto.De).ToList());
    }
}
