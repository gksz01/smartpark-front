using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.Padroes.Estrategia.Pagamentos;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Aplicacao.Pagamentos.Criar;

/// <summary>
/// Tarifa ativa (Strategy) → [TarifaComConvenio] → Pagamento (Strategy) → Pagar() → banco.
/// O pagamento e o consumo do benefício do convênio são gravados juntos.
/// </summary>
public sealed class CriarPagamentoManipulador(ISmartParkContexto contexto)
{
    private const int DuracaoMaximaHoras = 24;

    public async Task<Resultado<PagamentoDto>> ExecutarAsync(CriarPagamentoComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.Cobranca) is { } erroTenant) return Resultado<PagamentoDto>.Falha(erroTenant);
        if (comando.DuracaoHoras is < 1 or > DuracaoMaximaHoras)
            return Resultado<PagamentoDto>.Falha($"A duração deve ser um número inteiro de 1 a {DuracaoMaximaHoras} horas.");

        try
        {
            // 1. Strategy de pagamento escolhida pela forma (o PagamentoCredito valida o limite de parcelas)
            var estrategia = EstrategiaPagamentoPorForma.Criar(comando.Forma, comando.Forma == FormaPagamento.Credito ? comando.Parcelas : 1);

            // 2. Veículo (e reserva opcional) precisam ser DESTE tenant
            var veiculo = await contexto.Veiculos.SingleOrDefaultAsync(item => item.Id == comando.VeiculoId && item.TenantId == comando.TenantId, cancellationToken);
            if (veiculo is null) return Resultado<PagamentoDto>.Falha("Veículo não encontrado neste cliente.");
            if (comando.ReservaId is int reservaId)
            {
                var reserva = await contexto.Reservas.SingleOrDefaultAsync(item => item.Id == reservaId && item.TenantId == comando.TenantId, cancellationToken);
                if (reserva is null) return Resultado<PagamentoDto>.Falha("Reserva não encontrada neste cliente.");
                if (reserva.VeiculoId != veiculo.Id) return Resultado<PagamentoDto>.Falha("A reserva informada é de outro veículo.");
            }

            // 3. Tarifa ativa, com a Strategy reconstruída do banco
            var tarifa = await contexto.Tarifas.SingleOrDefaultAsync(item => item.TenantId == comando.TenantId && item.Ativa, cancellationToken);
            if (tarifa is null) return Resultado<PagamentoDto>.Falha("Não há tarifa ativa neste cliente. Ative uma tarifa antes de cobrar.");
            var estrategiaTarifa = tarifa.Estrategia;

            // 4. Convênio (só com ConvenioMedico): a Strategy do convênio é composta sobre a da tarifa
            Atendimento? atendimento = null;
            if (!string.IsNullOrWhiteSpace(comando.NumeroAtendimento))
            {
                if (ValidadorTenant.Validar(comando.TenantId, Recurso.ConvenioMedico) is { } erroConvenio) return Resultado<PagamentoDto>.Falha(erroConvenio);
                var numero = comando.NumeroAtendimento.Trim().ToUpperInvariant();
                atendimento = await contexto.Atendimentos.Include(item => item.Convenio)
                    .SingleOrDefaultAsync(item => item.TenantId == comando.TenantId && item.Numero == numero, cancellationToken);
                if (atendimento is null) return Resultado<PagamentoDto>.Falha("Atendimento não localizado.");
                if (atendimento.MotivoInelegibilidade(DateTime.Now) is { } motivo) return Resultado<PagamentoDto>.Falha(motivo);
                estrategiaTarifa = new TarifaComConvenio(tarifa.Estrategia, atendimento.Convenio);
            }

            // 5. Pagamento: a Strategy calcula valor cobrado, detalhe e prefixo do comprovante
            var pagamento = new Pagamento(0, comando.TenantId, veiculo.Id, comando.DuracaoHoras, tarifa.Calcular(comando.DuracaoHoras),
                estrategiaTarifa.Calcular(comando.DuracaoHoras), estrategia, comando.ReservaId, atendimento?.Id);
            pagamento.Pagar();
            atendimento?.ConsumirBeneficio(DateTime.Now); // impede usar o mesmo benefício de novo

            contexto.Pagamentos.Add(pagamento);
            await contexto.SaveChangesAsync(cancellationToken); // pagamento e benefício consumido: tudo ou nada
            return Resultado<PagamentoDto>.Ok(PagamentoDto.De(pagamento, veiculo, atendimento?.Numero, atendimento?.Convenio.Nome));
        }
        catch (RegraDeNegocioException falha)
        {
            return Resultado<PagamentoDto>.Falha(falha.Message);
        }
    }
}
