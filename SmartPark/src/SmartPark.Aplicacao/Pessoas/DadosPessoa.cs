using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Pessoas;

/// <summary>Campos do formulário de pessoa, usados na criação e na alteração.</summary>
public sealed record DadosPessoa(string Nome, string Documento, TipoPessoa Tipo, Perfil Perfil, bool Ativo = true);
