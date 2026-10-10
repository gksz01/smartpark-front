using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.Padroes.Estrategia.Pagamentos;

namespace SmartPark.Aplicacao.Pagamentos.Criar;

/// <summary>
/// Tarifa ativa (Strategy) → [TarifaComConvenio] → Pagamento (Strategy) → Pagar() → banco.
/// O pagamento e o consumo do benefício do convênio são gravados juntos.
/// </summary>
public sealed class CriarPagamentoManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<PagamentoDto>> ExecutarAsync(CriarPagamentoComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.Cobranca) is { } erroTenant) return Resultado<PagamentoDto>.Falha(erroTenant);

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

            // 3. Valor pela tarifa ativa e, com atendimento elegível, pelo convênio
            var (calculo, erro) = await CalculoPagamento.CalcularAsync(contexto, comando.TenantId, comando.DuracaoHoras,
                comando.NumeroAtendimento, rastrearAtendimento: true, cancellationToken);
            if (calculo is null) return Resultado<PagamentoDto>.Falha(erro!);

            // 4. Pagamento: a Strategy calcula valor cobrado, detalhe e prefixo do comprovante
            var pagamento = new Pagamento(0, comando.TenantId, veiculo.Id, comando.DuracaoHoras, calculo.ValorTarifa, calculo.Valor, estrategia,
                comando.ReservaId, calculo.Atendimento?.Id);
            pagamento.Pagar();
            calculo.Atendimento?.ConsumirBeneficio(DateTime.Now); // impede usar o mesmo benefício de novo

            contexto.Pagamentos.Add(pagamento);
            await contexto.SaveChangesAsync(cancellationToken); // pagamento e benefício consumido: tudo ou nada
            return Resultado<PagamentoDto>.Ok(PagamentoDto.De(pagamento, veiculo, calculo.Atendimento?.Numero, calculo.Atendimento?.Convenio.Nome));
        }
        catch (RegraDeNegocioException falha)
        {
            return Resultado<PagamentoDto>.Falha(falha.Message);
        }
    }
}
