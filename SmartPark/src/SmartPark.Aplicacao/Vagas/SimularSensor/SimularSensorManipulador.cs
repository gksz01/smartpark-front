using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.Padroes.Fabrica.Variantes;
using SmartPark.Dominio.Padroes.Observador;

namespace SmartPark.Aplicacao.Vagas.SimularSensor;

/// <summary>
/// OBSERVER — Exemplo 1 no sistema: Sensor (Subject) → ObservadorVagaSensor muda a Vaga →
/// ObservadorNotificacaoSensor cria a Notificacao → este caso de uso grava a vaga no banco.
/// </summary>
public sealed class SimularSensorManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<LeituraSensorDto>> ExecutarAsync(SimularSensorComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId) is { } erro) return Resultado<LeituraSensorDto>.Falha(erro);

        var vaga = await contexto.Vagas.SingleOrDefaultAsync(item => item.Id == comando.VagaId && item.TenantId == comando.TenantId, cancellationToken);
        if (vaga is null) return Resultado<LeituraSensorDto>.Falha("Vaga não encontrada.");

        // Não há tabela de sensores: o sensor começa com o estado que a vaga tem no banco
        var sensor = new Sensor(vaga.Id, $"SN-{vaga.Codigo}", vaga.Id);
        if (vaga.Status == StatusVaga.Ocupada) sensor.DetectarOcupacao();

        var notificacoes = new List<Notificacao>();
        RegistroObservadores.RegistrarObservadoresSensor(sensor, vaga, VariantePorTenant.Obter(comando.TenantId), notificacoes);

        try
        {
            var mudou = comando.Leitura == TipoEventoSensor.Ocupada ? sensor.DetectarOcupacao() : sensor.DetectarLiberacao();
            if (!mudou)
                return Resultado<LeituraSensorDto>.Falha($"O sensor já indica a vaga {vaga.Codigo} como {(sensor.Ocupado ? "ocupada" : "livre")}.");
        }
        catch (RegraDeNegocioException falha)
        {
            // A Vaga recusou a mudança pedida pelo observador (ex.: vaga Bloqueada não pode ser ocupada)
            return Resultado<LeituraSensorDto>.Falha(falha.Message);
        }

        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado<LeituraSensorDto>.Ok(new LeituraSensorDto(VagaDto.De(vaga), notificacoes.Select(item => item.Formatar()).ToList()));
    }
}
