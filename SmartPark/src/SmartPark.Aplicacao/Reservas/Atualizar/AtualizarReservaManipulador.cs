using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Aplicacao.Reservas.Atualizar;

public sealed class AtualizarReservaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<OperacaoReservaDto>> ExecutarAsync(AtualizarReservaComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.Reserva) is { } erroTenant) return Resultado<OperacaoReservaDto>.Falha(erroTenant);
        if (ReservaValidador.ValidarDuracao(comando.DuracaoHoras) is { } erro) return Resultado<OperacaoReservaDto>.Falha(erro);

        var reserva = await contexto.Reservas.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (reserva is null) return Resultado<OperacaoReservaDto>.Falha("Reserva não encontrada.");
        var tarifa = await contexto.Tarifas.SingleOrDefaultAsync(item => item.TenantId == comando.TenantId && item.Ativa, cancellationToken);
        if (tarifa is null) return Resultado<OperacaoReservaDto>.Falha("Não há tarifa ativa neste cliente. Ative uma tarifa antes de alterar a reserva.");

        var veiculo = await contexto.Veiculos.SingleAsync(item => item.Id == reserva.VeiculoId, cancellationToken);
        var vaga = await contexto.Vagas.SingleAsync(item => item.Id == reserva.VagaId, cancellationToken);
        var notificacoes = new List<Notificacao>();
        try
        {
            // A classe Reserva recusa alterar reservas canceladas ou concluídas
            EventosDaReserva.Montar(comando.TenantId, vaga, notificacoes).Alterar(reserva, comando.Data, comando.Hora, comando.DuracaoHoras);
        }
        catch (RegraDeNegocioException falha)
        {
            return Resultado<OperacaoReservaDto>.Falha(falha.Message);
        }
        reserva.CalcularEstimativa(tarifa);

        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado<OperacaoReservaDto>.Ok(new OperacaoReservaDto(ReservaDto.De(reserva, veiculo, vaga), notificacoes.Select(item => item.Mensagem).ToList()));
    }
}
