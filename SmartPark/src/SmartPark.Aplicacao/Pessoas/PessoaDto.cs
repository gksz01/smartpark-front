using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Pessoas;

public sealed record PessoaDto(int Id, string Nome, string Documento, TipoPessoa Tipo, Perfil Perfil, bool Ativo)
{
    public static PessoaDto De(Usuario usuario) =>
        new(usuario.Id, usuario.Nome, usuario.Documento, usuario.Tipo, usuario.Perfil, usuario.Ativo);
}
