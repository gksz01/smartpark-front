using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;

namespace SmartPark.Aplicacao.Pessoas.Excluir;

public sealed class ExcluirPessoaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado> ExecutarAsync(ExcluirPessoaComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId) is { } erro) return Resultado.Falha(erro);

        var usuario = await contexto.Usuarios.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (usuario is null) return Resultado.Falha("Pessoa não encontrada.");

        contexto.Usuarios.Remove(usuario);
        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado.Ok();
    }
}
