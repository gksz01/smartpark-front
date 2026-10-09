using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Convenios.Excluir;

public sealed class ExcluirConvenioManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado> ExecutarAsync(ExcluirConvenioComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.ConvenioMedico) is { } erro) return Resultado.Falha(erro);

        var convenio = await contexto.Convenios.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (convenio is null) return Resultado.Falha("Convênio não encontrado.");

        var atendimentos = await contexto.Atendimentos.CountAsync(atendimento => atendimento.ConvenioId == convenio.Id, cancellationToken);
        if (atendimentos > 0)
            return Resultado.Falha($"O convênio {convenio.Nome} possui {atendimentos} atendimento(s) vinculado(s) e não pode ser excluído. Desative-o em vez de excluir.");

        contexto.Convenios.Remove(convenio);
        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado.Ok();
    }
}
