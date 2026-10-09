using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Pagamentos;

public sealed record PagamentoDto(int Id, int VeiculoId, string Veiculo, int? ReservaId, string? NumeroAtendimento, string? Convenio,
    int DuracaoHoras, decimal ValorTarifa, decimal Valor, decimal ValorCobrado, FormaPagamento Forma, int Parcelas, string Detalhe,
    StatusPagamento Status, string Comprovante, DateTime CriadoEm)
{
    public static PagamentoDto De(Pagamento pagamento, Veiculo veiculo, string? numeroAtendimento, string? convenio) => new(pagamento.Id, veiculo.Id,
        $"{veiculo.Apelido} · {veiculo.Placa}", pagamento.ReservaId, numeroAtendimento, convenio, pagamento.DuracaoHoras,
        pagamento.ValorTarifa, pagamento.Valor, pagamento.ValorCobrado, pagamento.Forma, pagamento.Parcelas, pagamento.Detalhe,
        pagamento.Status, pagamento.Comprovante, pagamento.CriadoEm);
}
