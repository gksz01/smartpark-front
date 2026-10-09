using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Acessos;

/// <summary>
/// Campos do formulário de acesso. O método não vem da tela: é sempre o MetodoAcesso do tenant.
/// </summary>
public sealed record DadosAcesso(string Pessoa, string Identificador, DirecaoAcesso Direcao, StatusAcesso Status, string MotivoNegacao = "");
