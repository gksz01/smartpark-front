using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.Padroes.Estrategia.Pagamentos;

namespace SmartPark.Aplicacao.Pagamentos.Simular;

/// <summary>Mesmo cálculo da criação (CalculoPagamento + Strategy de pagamento), sem gravar nada.</summary>
public sealed class SimularPagamentoManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<SimulacaoPagamentoDto>> ExecutarAsync(SimulacaoPagamentoConsulta consulta, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(consulta.TenantId, Recurso.Cobranca) is { } erroTenant) return Resultado<SimulacaoPagamentoDto>.Falha(erroTenant);

        try
        {
            var estrategia = EstrategiaPagamentoPorForma.Criar(consulta.Forma, consulta.Forma == FormaPagamento.Credito ? consulta.Parcelas : 1);
            var (calculo, erro) = await CalculoPagamento.CalcularAsync(contexto, consulta.TenantId, consulta.DuracaoHoras,
                consulta.NumeroAtendimento, rastrearAtendimento: false, cancellationToken);
            if (calculo is null) return Resultado<SimulacaoPagamentoDto>.Falha(erro!);

            var cobranca = estrategia.Cobrar(calculo.Valor);
            var convenio = calculo.Atendimento?.Convenio;
            return Resultado<SimulacaoPagamentoDto>.Ok(new SimulacaoPagamentoDto(calculo.Tarifa.Nome, calculo.ValorTarifa, convenio?.Nome,
                convenio?.DescricaoBeneficio(), calculo.Valor, cobranca.ValorCobrado, cobranca.Detalhe));
        }
        catch (RegraDeNegocioException falha)
        {
            return Resultado<SimulacaoPagamentoDto>.Falha(falha.Message);
        }
    }
}
