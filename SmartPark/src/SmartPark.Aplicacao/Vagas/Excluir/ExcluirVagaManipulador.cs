using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;

namespace SmartPark.Aplicacao.Vagas.Excluir;

public sealed class ExcluirVagaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado> ExecutarAsync(ExcluirVagaComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId) is { } erro) return Resultado.Falha(erro);

        var vaga = await contexto.Vagas.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (vaga is null) return Resultado.Falha("Vaga não encontrada.");

        if (!vaga.PodeSerExcluida())
            return Resultado.Falha($"A vaga {vaga.Codigo} está {vaga.Status} e não pode ser excluída. Libere ou bloqueie a vaga antes.");
        if (await contexto.Reservas.AnyAsync(reserva => reserva.VagaId == vaga.Id, cancellationToken))
            return Resultado.Falha($"A vaga {vaga.Codigo} possui reservas registradas. Exclua as reservas dela antes.");

        contexto.Vagas.Remove(vaga);
        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado.Ok();
    }
}
