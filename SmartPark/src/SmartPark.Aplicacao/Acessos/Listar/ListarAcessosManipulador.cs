using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;

namespace SmartPark.Aplicacao.Acessos.Listar;

public sealed class ListarAcessosManipulador(ISmartParkContexto contexto)
{
    /// <summary>Mais recentes primeiro.</summary>
    public async Task<Resultado<IReadOnlyList<AcessoDto>>> ExecutarAsync(ListarAcessosConsulta consulta, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(consulta.TenantId) is { } erro) return Resultado<IReadOnlyList<AcessoDto>>.Falha(erro);

        var acessos = await contexto.Acessos.AsNoTracking()
            .Where(acesso => acesso.TenantId == consulta.TenantId)
            .OrderByDescending(acesso => acesso.Horario).ThenByDescending(acesso => acesso.Id)
            .ToListAsync(cancellationToken);
        return Resultado<IReadOnlyList<AcessoDto>>.Ok(acessos.Select(AcessoDto.De).ToList());
    }
}
