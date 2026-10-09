using SmartPark.Dominio.Comum;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Entidades;

/// <summary>Mensagem exibida ao usuário sobre algo que aconteceu no estacionamento.</summary>
public class Notificacao
{
    public int Id { get; private set; }
    public string Titulo { get; private set; }
    public string Mensagem { get; private set; }
    public TipoNotificacao Tipo { get; private set; }
    public DateTime CriadaEm { get; private set; }
    public bool Lida { get; private set; }

    public Notificacao(int id, string titulo, string mensagem, TipoNotificacao tipo = TipoNotificacao.Info, DateTime? criadaEm = null)
    {
        Id = id;
        Titulo = titulo;
        Mensagem = mensagem;
        Tipo = tipo;
        CriadaEm = criadaEm ?? DateTime.Now;
    }

    /// <summary>Ex.: "[14:32] Vaga ocupada: A-01 foi ocupada."</summary>
    public string Formatar() => $"[{Formatacao.FormatarHora(CriadaEm)}] {Titulo}: {Mensagem}";

    public void MarcarComoLida() => Lida = true;

    public bool EhAlerta() => Tipo == TipoNotificacao.Alerta;
}
