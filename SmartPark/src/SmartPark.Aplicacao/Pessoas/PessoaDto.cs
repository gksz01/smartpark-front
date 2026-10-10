using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Pessoas;

/// <summary>EhVisitante e EhPacienteOuAcompanhante vêm da classe Usuario (usados no destaque da tela).</summary>
public sealed record PessoaDto(int Id, string Nome, string Documento, TipoPessoa Tipo, Perfil Perfil, bool Ativo, bool EhVisitante, bool EhPacienteOuAcompanhante)
{
    public static PessoaDto De(Usuario usuario) =>
        new(usuario.Id, usuario.Nome, usuario.Documento, usuario.Tipo, usuario.Perfil, usuario.Ativo, usuario.EhVisitante(), usuario.EhPacienteOuAcompanhante());
}
