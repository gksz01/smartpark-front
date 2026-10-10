using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Aplicacao.Pagamentos;

/// <summary>
/// Valor de um pagamento, usado pela simulação (prévia na tela) e pela criação:
/// Tarifa ativa (Strategy) → [TarifaComConvenio, quando há atendimento elegível].
/// </summary>
internal sealed record CalculoPagamento(Tarifa Tarifa, Atendimento? Atendimento, decimal ValorTarifa, decimal Valor)
{
    public const int DuracaoMaximaHoras = 24;

    /// <summary>Devolve o cálculo ou a mensagem de erro (sem tarifa ativa, atendimento inexistente ou inelegível...).</summary>
    public static async Task<(CalculoPagamento? Calculo, string? Erro)> CalcularAsync(ISmartParkContexto contexto, string tenantId, int duracaoHoras,
        string? numeroAtendimento, bool rastrearAtendimento, CancellationToken cancellationToken)
    {
        if (duracaoHoras is < 1 or > DuracaoMaximaHoras) return (null, $"A duração deve ser um número inteiro de 1 a {DuracaoMaximaHoras} horas.");

        var tarifa = await contexto.Tarifas.AsNoTracking().SingleOrDefaultAsync(item => item.TenantId == tenantId && item.Ativa, cancellationToken);
        if (tarifa is null) return (null, "Não há tarifa ativa neste cliente. Ative uma tarifa antes de cobrar.");

        IEstrategiaTarifa estrategia = tarifa.Estrategia;
        Atendimento? atendimento = null;
        if (!string.IsNullOrWhiteSpace(numeroAtendimento))
        {
            if (ValidadorTenant.Validar(tenantId, Recurso.ConvenioMedico) is { } erroConvenio) return (null, erroConvenio);
            var numero = numeroAtendimento.Trim().ToUpperInvariant();
            var atendimentos = rastrearAtendimento ? contexto.Atendimentos : contexto.Atendimentos.AsNoTracking();
            atendimento = await atendimentos.Include(item => item.Convenio)
                .SingleOrDefaultAsync(item => item.TenantId == tenantId && item.Numero == numero, cancellationToken);
            if (atendimento is null) return (null, "Atendimento não localizado.");
            if (atendimento.MotivoInelegibilidade(DateTime.Now) is { } motivo) return (null, motivo);
            estrategia = new TarifaComConvenio(tarifa.Estrategia, atendimento.Convenio);
        }

        return (new CalculoPagamento(tarifa, atendimento, tarifa.Calcular(duracaoHoras), estrategia.Calcular(duracaoHoras)), null);
    }
}
