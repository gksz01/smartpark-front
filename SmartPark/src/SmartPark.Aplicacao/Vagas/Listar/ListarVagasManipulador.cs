using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;

namespace SmartPark.Aplicacao.Vagas.Listar;

public sealed class ListarVagasManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<IReadOnlyList<VagaDto>>> ExecutarAsync(ListarVagasConsulta consulta, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(consulta.TenantId) is { } erro) return Resultado<IReadOnlyList<VagaDto>>.Falha(erro);

        var vagas = await contexto.Vagas.AsNoTracking()
            .Where(vaga => vaga.TenantId == consulta.TenantId)
            .OrderBy(vaga => vaga.Codigo)
            .ToListAsync(cancellationToken);
        return Resultado<IReadOnlyList<VagaDto>>.Ok(vagas.Select(VagaDto.De).ToList());
    }
}
