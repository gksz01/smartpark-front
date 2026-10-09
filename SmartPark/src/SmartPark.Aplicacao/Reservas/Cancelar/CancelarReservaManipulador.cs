using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Aplicacao.Reservas.Cancelar;

/// <summary>Cancela pelo Observer, que libera a vaga se ela ainda estiver Reservada.</summary>
public sealed class CancelarReservaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<OperacaoReservaDto>> ExecutarAsync(CancelarReservaComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.Reserva) is { } erro) return Resultado<OperacaoReservaDto>.Falha(erro);

        var reserva = await contexto.Reservas.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (reserva is null) return Resultado<OperacaoReservaDto>.Falha("Reserva não encontrada.");

        var veiculo = await contexto.Veiculos.SingleAsync(item => item.Id == reserva.VeiculoId, cancellationToken);
        var vaga = await contexto.Vagas.SingleAsync(item => item.Id == reserva.VagaId, cancellationToken);
        var notificacoes = new List<Notificacao>();
        try
        {
            EventosDaReserva.Montar(comando.TenantId, vaga, notificacoes).Cancelar(reserva);
        }
        catch (RegraDeNegocioException falha)
        {
            return Resultado<OperacaoReservaDto>.Falha(falha.Message);
        }

        await contexto.SaveChangesAsync(cancellationToken); // reserva cancelada e vaga liberada juntas
        return Resultado<OperacaoReservaDto>.Ok(new OperacaoReservaDto(ReservaDto.De(reserva, veiculo, vaga), notificacoes.Select(item => item.Mensagem).ToList()));
    }
}
