using SmartPark.Dominio.Comum;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Dominio.Entidades;

/// <summary>
/// Registro de uma entrada ou saída na portaria.
/// O identificador depende do método do tenant: placa (LPR), código (QR) ou tag (RFID).
/// </summary>
public class Acesso
{
    public int Id { get; private set; }
    public string TenantId { get; private set; }
    public string Pessoa { get; private set; }
    public string Identificador { get; private set; }
    public MetodoAcesso Metodo { get; private set; }
    public DirecaoAcesso Direcao { get; private set; }
    public StatusAcesso Status { get; private set; }
    public bool Manual { get; private set; }
    public DateTime Horario { get; private set; }
    public string? MotivoNegacao { get; private set; }

    public Acesso(int id, string tenantId, string pessoa, string identificador, MetodoAcesso metodo, DirecaoAcesso direcao, bool manual = false, DateTime? horario = null)
    {
        Id = id;
        TenantId = tenantId;
        Pessoa = pessoa;
        Identificador = identificador;
        Metodo = metodo;
        Direcao = direcao;
        Manual = manual;
        Horario = horario ?? DateTime.Now;
        Status = StatusAcesso.Pendente;
    }

    // Usado pelo EF Core ao ler do banco.
    private Acesso() : this(0, "", "", "", MetodoAcesso.Manual, DirecaoAcesso.Entrada) { }

    public void Atualizar(string pessoa, string identificador, DirecaoAcesso direcao)
    {
        Pessoa = pessoa;
        Identificador = identificador;
        Direcao = direcao;
    }

    /// <summary>
    /// Leva o acesso ao status pedido: Pendente → Liberado (Liberar) ou → Negado (Negar).
    /// Um acesso decidido não volta para Pendente; no Negado é permitido corrigir o motivo.
    /// </summary>
    public void AlterarStatus(StatusAcesso novoStatus, string motivo)
    {
        if (novoStatus == Status)
        {
            if (novoStatus == StatusAcesso.Negado) CorrigirMotivo(motivo);
            return;
        }
        if (novoStatus == StatusAcesso.Pendente)
            throw new RegraDeNegocioException($"Este acesso já foi {Status.ToString().ToLowerInvariant()} e não pode voltar para Pendente.");
        if (novoStatus == StatusAcesso.Liberado) Liberar();
        else Negar(motivo);
    }

    public void Liberar()
    {
        GarantirPendente();
        Status = StatusAcesso.Liberado;
    }

    public void Negar(string motivo)
    {
        GarantirPendente();
        if (string.IsNullOrWhiteSpace(motivo))
            throw new RegraDeNegocioException("Informe o motivo da negação.");
        Status = StatusAcesso.Negado;
        MotivoNegacao = motivo.Trim();
    }

    private void CorrigirMotivo(string motivo)
    {
        if (string.IsNullOrWhiteSpace(motivo))
            throw new RegraDeNegocioException("Informe o motivo da negação.");
        MotivoNegacao = motivo.Trim();
    }

    /// <summary>Liberação feita por um operador, fora da leitura automática.</summary>
    public bool EhManual() => Manual || Metodo == MetodoAcesso.Manual;

    public bool EhEntrada() => Direcao == DirecaoAcesso.Entrada;

    public string HorarioFormatado() => Formatacao.FormatarHora(Horario);

    // Um acesso já decidido (liberado ou negado) não muda mais de status.
    private void GarantirPendente()
    {
        if (Status != StatusAcesso.Pendente)
            throw new RegraDeNegocioException($"Este acesso já foi {Status.ToString().ToLowerInvariant()}.");
    }
}
