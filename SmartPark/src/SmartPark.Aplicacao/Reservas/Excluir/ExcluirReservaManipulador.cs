using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Reservas.Excluir;

/// <summary>Só reservas canceladas ou concluídas.</summary>
public sealed class ExcluirReservaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado> ExecutarAsync(ExcluirReservaComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.Reserva) is { } erro) return Resultado.Falha(erro);

        var reserva = await contexto.Reservas.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (reserva is null) return Resultado.Falha("Reserva não encontrada.");
        if (reserva.EstaAtiva()) return Resultado.Falha("Cancele a reserva antes de excluir.");
        if (await contexto.Pagamentos.AnyAsync(pagamento => pagamento.ReservaId == reserva.Id, cancellationToken))
            return Resultado.Falha("Esta reserva possui pagamento registrado. Exclua o pagamento antes.");

        contexto.Reservas.Remove(reserva);
        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado.Ok();
    }
}
