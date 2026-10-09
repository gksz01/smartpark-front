using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Convenios.Listar;

public sealed class ListarConveniosManipulador(ISmartParkContexto contexto)
{
    /// <summary>Com a quantidade de atendimentos de cada convênio (quem tem atendimento não pode ser excluído).</summary>
    public async Task<Resultado<IReadOnlyList<ConvenioDto>>> ExecutarAsync(ListarConveniosConsulta consulta, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(consulta.TenantId, Recurso.ConvenioMedico) is { } erro) return Resultado<IReadOnlyList<ConvenioDto>>.Falha(erro);

        var convenios = await contexto.Convenios.AsNoTracking()
            .Where(convenio => convenio.TenantId == consulta.TenantId)
            .OrderBy(convenio => convenio.Nome)
            .Select(convenio => new { Convenio = convenio, Atendimentos = contexto.Atendimentos.Count(atendimento => atendimento.ConvenioId == convenio.Id) })
            .ToListAsync(cancellationToken);
        return Resultado<IReadOnlyList<ConvenioDto>>.Ok(convenios.Select(item => ConvenioDto.De(item.Convenio, item.Atendimentos)).ToList());
    }
}
