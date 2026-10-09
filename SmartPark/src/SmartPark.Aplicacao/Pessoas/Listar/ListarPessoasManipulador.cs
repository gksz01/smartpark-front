using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;

namespace SmartPark.Aplicacao.Pessoas.Listar;

public sealed class ListarPessoasManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<IReadOnlyList<PessoaDto>>> ExecutarAsync(ListarPessoasConsulta consulta, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(consulta.TenantId) is { } erro) return Resultado<IReadOnlyList<PessoaDto>>.Falha(erro);

        var pessoas = await contexto.Usuarios.AsNoTracking()
            .Where(usuario => usuario.TenantId == consulta.TenantId)
            .OrderBy(usuario => usuario.Nome)
            .ToListAsync(cancellationToken);
        return Resultado<IReadOnlyList<PessoaDto>>.Ok(pessoas.Select(PessoaDto.De).ToList());
    }
}
