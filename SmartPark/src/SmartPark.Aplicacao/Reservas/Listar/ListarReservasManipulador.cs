using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Reservas.Listar;

public sealed class ListarReservasManipulador(ISmartParkContexto contexto)
{
    /// <summary>Mais recentes primeiro, com o veículo e a vaga de cada reserva.</summary>
    public async Task<Resultado<IReadOnlyList<ReservaDto>>> ExecutarAsync(ListarReservasConsulta consulta, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(consulta.TenantId, Recurso.Reserva) is { } erro) return Resultado<IReadOnlyList<ReservaDto>>.Falha(erro);

        var linhas = await (
                from reserva in contexto.Reservas.AsNoTracking()
                join veiculo in contexto.Veiculos on reserva.VeiculoId equals veiculo.Id
                join vaga in contexto.Vagas on reserva.VagaId equals vaga.Id
                where reserva.TenantId == consulta.TenantId
                orderby reserva.Data descending, reserva.Hora descending
                select new { reserva, veiculo, vaga })
            .ToListAsync(cancellationToken);
        return Resultado<IReadOnlyList<ReservaDto>>.Ok(linhas.Select(linha => ReservaDto.De(linha.reserva, linha.veiculo, linha.vaga)).ToList());
    }
}
