using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;

namespace SmartPark.Aplicacao.Demonstracao.Restaurar;

public sealed class RestaurarDemonstracaoManipulador(IPopuladorBanco populador)
{
    public async Task<Resultado> ExecutarAsync(RestaurarDemonstracaoComando comando, CancellationToken cancellationToken = default)
    {
        await populador.ResetarAsync(cancellationToken);
        return Resultado.Ok();
    }
}
