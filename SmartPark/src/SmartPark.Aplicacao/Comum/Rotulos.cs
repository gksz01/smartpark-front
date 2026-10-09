using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Comum;

/// <summary>Texto exibido ao usuário para cada valor de enum. Os que não estão na lista usam o próprio nome.</summary>
public static class Rotulos
{
    private static readonly Dictionary<Enum, string> Especiais = new()
    {
        [TipoVaga.Eletrica] = "Elétrica",
        [TipoVaga.Prioritaria] = "Prioritária",
        [TipoPessoa.Funcionario] = "Funcionário",
        [Perfil.Funcionario] = "Funcionário",
        [MetodoAcesso.Lpr] = "Leitura de placa (LPR)",
        [MetodoAcesso.Rfid] = "Tag RFID",
        [MetodoAcesso.QrCode] = "QR Code",
        [MetodoAcesso.Manual] = "Liberação manual",
        [DirecaoAcesso.Saida] = "Saída",
        [TipoBeneficio.Isencao] = "Isenção",
        [TipoBeneficio.HorasGratis] = "Horas grátis",
        [TipoEstrategiaTarifa.PorHora] = "Por hora",
        [TipoEstrategiaTarifa.Diaria] = "Diária fixa",
        [FormaPagamento.Credito] = "Crédito",
        [FormaPagamento.Debito] = "Débito",
        [StatusReserva.Concluida] = "Concluída",
        [Recurso.Pagamentos] = "Pagamento",
        [Recurso.GestaoVisitantes] = "Gestão de visitantes",
        [Recurso.ConvenioMedico] = "Convênio médico",
        [Recurso.Cobranca] = "Cobrança individual",
        [Recurso.Relatorios] = "Relatórios",
        [Recurso.Notificacoes] = "Notificações",
        [Recurso.WhiteLabel] = "White-label",
    };

    public static string De(Enum valor) => Especiais.TryGetValue(valor, out var rotulo) ? rotulo : valor.ToString();

    /// <summary>Ex.: [Comum, PCD] → "Comum, PCD" (usado nas mensagens "Use: ...").</summary>
    public static string Lista<TEnum>(IEnumerable<TEnum> valores) where TEnum : struct, Enum =>
        string.Join(", ", valores.Select(valor => De(valor)));
}
