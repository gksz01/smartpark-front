using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Aplicacao.Reservas.Criar;

/// <summary>
/// Cria a reserva, calcula a estimativa com a Strategy da tarifa ativa, confirma pelo Observer
/// (que reserva a vaga) e grava reserva e vaga juntas.
/// </summary>
public sealed class CriarReservaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<OperacaoReservaDto>> ExecutarAsync(CriarReservaComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.Reserva) is { } erroTenant) return Resultado<OperacaoReservaDto>.Falha(erroTenant);
        if (ReservaValidador.ValidarDuracao(comando.DuracaoHoras) is { } erro) return Resultado<OperacaoReservaDto>.Falha(erro);

        // Veículo e vaga precisam ser DESTE tenant (não basta confiar no id enviado)
        var veiculo = await contexto.Veiculos.SingleOrDefaultAsync(item => item.Id == comando.VeiculoId && item.TenantId == comando.TenantId, cancellationToken);
        if (veiculo is null) return Resultado<OperacaoReservaDto>.Falha("Veículo não encontrado neste cliente.");
        var vaga = await contexto.Vagas.SingleOrDefaultAsync(item => item.Id == comando.VagaId && item.TenantId == comando.TenantId, cancellationToken);
        if (vaga is null) return Resultado<OperacaoReservaDto>.Falha("Vaga não encontrada neste cliente.");
        var tarifa = await contexto.Tarifas.SingleOrDefaultAsync(item => item.TenantId == comando.TenantId && item.Ativa, cancellationToken);
        if (tarifa is null) return Resultado<OperacaoReservaDto>.Falha("Não há tarifa ativa neste cliente. Ative uma tarifa antes de reservar.");

        if (!vaga.EstaDisponivel())
            return Resultado<OperacaoReservaDto>.Falha($"A vaga {vaga.Codigo} não está livre para reserva (status: {vaga.Status}).");

        var reserva = new Reserva(0, comando.TenantId, veiculo.Id, vaga.Id, comando.Data, comando.Hora, comando.DuracaoHoras);
        reserva.CalcularEstimativa(tarifa); // Reserva → Tarifa → Strategy concreta

        var notificacoes = new List<Notificacao>();
        try
        {
            EventosDaReserva.Montar(comando.TenantId, vaga, notificacoes).Confirmar(reserva); // Observer: vaga.Reservar() + notificação
        }
        catch (RegraDeNegocioException falha)
        {
            return Resultado<OperacaoReservaDto>.Falha(falha.Message);
        }

        contexto.Reservas.Add(reserva);
        await contexto.SaveChangesAsync(cancellationToken); // reserva e status da vaga na mesma transação
        return Resultado<OperacaoReservaDto>.Ok(new OperacaoReservaDto(ReservaDto.De(reserva, veiculo, vaga), notificacoes.Select(item => item.Mensagem).ToList()));
    }
}
