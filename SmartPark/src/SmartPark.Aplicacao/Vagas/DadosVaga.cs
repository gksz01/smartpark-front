using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Vagas;

/// <summary>Campos do formulário de vaga, usados na criação e na alteração.</summary>
public sealed record DadosVaga(string Codigo, string Setor, TipoVaga Tipo, StatusVaga Status = StatusVaga.Livre);
