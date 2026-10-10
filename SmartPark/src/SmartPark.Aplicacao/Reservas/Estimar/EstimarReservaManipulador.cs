using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Reservas.Estimar;

/// <summary>Mesmo caminho da criação: Reserva → Tarifa ativa → Strategy. Nada é gravado.</summary>
public sealed class EstimarReservaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<EstimativaReservaDto>> ExecutarAsync(EstimarReservaConsulta consulta, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(consulta.TenantId, Recurso.Reserva) is { } erroTenant) return Resultado<EstimativaReservaDto>.Falha(erroTenant);
        if (ReservaValidador.ValidarDuracao(consulta.DuracaoHoras) is { } erro) return Resultado<EstimativaReservaDto>.Falha(erro);

        var tarifa = await contexto.Tarifas.AsNoTracking().SingleOrDefaultAsync(item => item.TenantId == consulta.TenantId && item.Ativa, cancellationToken);
        if (tarifa is null) return Resultado<EstimativaReservaDto>.Falha("Sem tarifa ativa");

        var reserva = new Reserva(0, consulta.TenantId, 0, 0, DateOnly.FromDateTime(DateTime.Today), TimeOnly.MinValue, consulta.DuracaoHoras);
        return Resultado<EstimativaReservaDto>.Ok(new EstimativaReservaDto(tarifa.Nome, reserva.CalcularEstimativa(tarifa)));
    }
}
