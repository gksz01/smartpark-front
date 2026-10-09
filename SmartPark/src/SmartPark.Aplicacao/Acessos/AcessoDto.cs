using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Acessos;

public sealed record AcessoDto(int Id, string Pessoa, string Identificador, MetodoAcesso Metodo, DirecaoAcesso Direcao,
    StatusAcesso Status, bool Manual, string MotivoNegacao, string Horario)
{
    public static AcessoDto De(Acesso acesso) => new(acesso.Id, acesso.Pessoa, acesso.Identificador, acesso.Metodo, acesso.Direcao,
        acesso.Status, acesso.EhManual(), acesso.MotivoNegacao ?? "", acesso.HorarioFormatado());
}
