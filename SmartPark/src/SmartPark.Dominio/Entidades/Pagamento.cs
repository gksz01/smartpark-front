using SmartPark.Dominio.Comum;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.Padroes.Estrategia.Pagamentos;

namespace SmartPark.Dominio.Entidades;

/// <summary>
/// STRATEGY — Context do exemplo de pagamento.
/// O Pagamento cuida das regras comuns (status, valor, comprovante) e delega a
/// cobrança para a IEstrategiaPagamento escolhida (Pix, Crédito ou Débito), sem saber qual é.
/// </summary>
public class Pagamento
{
    private IEstrategiaPagamento? _estrategia;

    public int Id { get; private set; }
    public string TenantId { get; private set; } = "";

    /// <summary>Código único da transação; os 6 primeiros caracteres formam o comprovante.</summary>
    public Guid Codigo { get; private set; }

    public int VeiculoId { get; private set; }
    public int? ReservaId { get; private set; }

    /// <summary>Atendimento do convênio médico (Hospital) usado neste pagamento.</summary>
    public int? AtendimentoId { get; private set; }

    public int DuracaoHoras { get; private set; }

    /// <summary>Valor pela tarifa ativa, antes do convênio.</summary>
    public decimal ValorTarifa { get; private set; }

    /// <summary>Valor a pagar (já com o convênio, quando houver).</summary>
    public decimal Valor { get; private set; }

    // Como a estratégia fica gravada no banco (ver EstrategiaPagamentoPorForma).
    public FormaPagamento Forma { get; private set; }
    public int Parcelas { get; private set; }

    public StatusPagamento Status { get; private set; }
    public decimal ValorCobrado { get; private set; }
    public string Detalhe { get; private set; } = "";
    public string Comprovante { get; private set; } = "";
    public DateTime CriadoEm { get; private set; }

    public Pagamento(int id, string tenantId, int veiculoId, int duracaoHoras, decimal valorTarifa, decimal valor, IEstrategiaPagamento estrategia,
        int? reservaId = null, int? atendimentoId = null, Guid? codigo = null, DateTime? criadoEm = null)
    {
        Id = id;
        TenantId = tenantId;
        VeiculoId = veiculoId;
        DuracaoHoras = duracaoHoras;
        ValorTarifa = valorTarifa;
        Valor = valor;
        ReservaId = reservaId;
        AtendimentoId = atendimentoId;
        Codigo = codigo ?? Guid.NewGuid();
        CriadoEm = criadoEm ?? DateTime.Now;
        Status = StatusPagamento.Pendente;
        DefinirEstrategia(estrategia);
    }

    // Usado pelo EF Core ao ler do banco; a estratégia é reconstruída no primeiro uso.
    private Pagamento() { }

    public IEstrategiaPagamento Estrategia => _estrategia ??= EstrategiaPagamentoPorForma.Criar(Forma, Parcelas);

    /// <summary>A forma de pagamento só pode ser trocada antes da cobrança.</summary>
    public void DefinirEstrategia(IEstrategiaPagamento estrategia)
    {
        if (Status != StatusPagamento.Pendente)
            throw new RegraDeNegocioException("Não é possível trocar a forma de um pagamento já processado.");
        _estrategia = estrategia;
        Forma = estrategia.Forma;
        Parcelas = estrategia.Parcelas;
    }

    /// <summary>Pagamento simulado: a estratégia cobra e o Pagamento aprova e emite o comprovante.</summary>
    public void Pagar()
    {
        if (Status != StatusPagamento.Pendente)
            throw new RegraDeNegocioException("Este pagamento já foi processado.");
        // Valor zero é aceito: o convênio de isenção (TarifaComConvenio) gera pagamento de R$ 0,00
        if (Valor < 0)
            throw new RegraDeNegocioException("O valor do pagamento não pode ser negativo.");

        var resultado = Estrategia.Cobrar(Valor);
        ValorCobrado = resultado.ValorCobrado;
        Detalhe = resultado.Detalhe;
        Status = StatusPagamento.Aprovado;
        Comprovante = GerarComprovante();
    }

    public void Estornar()
    {
        if (Status != StatusPagamento.Aprovado)
            throw new RegraDeNegocioException("Apenas pagamentos aprovados podem ser estornados.");
        Status = StatusPagamento.Estornado;
    }

    /// <summary>O prefixo identifica a forma de pagamento: PIX-, CRE- ou DEB-.</summary>
    public string GerarComprovante() => $"{Estrategia.PrefixoComprovante}-{Codigo.ToString("N")[..6].ToUpperInvariant()}";

    public bool EstaAprovado() => Status == StatusPagamento.Aprovado;

    public string ValorFormatado() => Formatacao.FormatarMoeda(Valor);
}
