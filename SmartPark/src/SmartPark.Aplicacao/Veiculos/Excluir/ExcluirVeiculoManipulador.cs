using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;

namespace SmartPark.Aplicacao.Veiculos.Excluir;

public sealed class ExcluirVeiculoManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado> ExecutarAsync(ExcluirVeiculoComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId) is { } erro) return Resultado.Falha(erro);

        var veiculo = await contexto.Veiculos.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (veiculo is null) return Resultado.Falha("Veículo não encontrado.");

        // As chaves estrangeiras também impedem; aqui a mensagem diz o que fazer
        if (await contexto.Reservas.AnyAsync(reserva => reserva.VeiculoId == veiculo.Id, cancellationToken))
            return Resultado.Falha("Este veículo possui reservas. Exclua as reservas dele antes.");
        if (await contexto.Pagamentos.AnyAsync(pagamento => pagamento.VeiculoId == veiculo.Id, cancellationToken))
            return Resultado.Falha("Este veículo possui pagamentos registrados. Exclua os pagamentos dele antes.");

        contexto.Veiculos.Remove(veiculo);
        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado.Ok();
    }
}
