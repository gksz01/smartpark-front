using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Convenios;

/// <summary>Campos do formulário de convênio. ValorBeneficio é o percentual ou as horas grátis.</summary>
public sealed record DadosConvenio(string Nome, TipoBeneficio TipoBeneficio, int ValorBeneficio, bool Ativo = true);
