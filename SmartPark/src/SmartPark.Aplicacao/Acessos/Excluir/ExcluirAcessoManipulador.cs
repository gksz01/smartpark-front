using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;

namespace SmartPark.Aplicacao.Acessos.Excluir;

public sealed class ExcluirAcessoManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado> ExecutarAsync(ExcluirAcessoComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId) is { } erro) return Resultado.Falha(erro);

        var removidos = await contexto.Acessos
            .Where(item => item.Id == comando.Id && item.TenantId == comando.TenantId)
            .ExecuteDeleteAsync(cancellationToken);
        return removidos == 0 ? Resultado.Falha("Acesso não encontrado.") : Resultado.Ok();
    }
}
