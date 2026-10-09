using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Tarifas.Excluir;

public sealed class ExcluirTarifaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado> ExecutarAsync(ExcluirTarifaComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.Cobranca) is { } erro) return Resultado.Falha(erro);

        var tarifa = await contexto.Tarifas.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (tarifa is null) return Resultado.Falha("Tarifa não encontrada.");
        if (tarifa.Ativa)
            return Resultado.Falha($"A tarifa {tarifa.Nome} está ativa. Ative outra tarifa ou desative esta antes de excluir.");

        contexto.Tarifas.Remove(tarifa);
        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado.Ok();
    }
}
