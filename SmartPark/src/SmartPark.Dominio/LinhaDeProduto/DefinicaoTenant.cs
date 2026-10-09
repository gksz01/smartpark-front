using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.LinhaDeProduto.Tipos;

namespace SmartPark.Dominio.LinhaDeProduto;

/// <summary>
/// Configuração de uma variante da Linha de Produto.
/// Toda a variabilidade (recursos, perfis, tipos de vaga, tema...) fica aqui,
/// para o resto do sistema não precisar de "if (tenant == ...)".
/// </summary>
public sealed class DefinicaoTenant
{
    public required string Identificador { get; init; }
    public required string Nome { get; init; }
    public required string NomeCurto { get; init; }
    public required string Logo { get; init; }
    public required string Chamada { get; init; }
    public required string BoasVindas { get; init; }
    public required MetodoAcesso MetodoAcesso { get; init; }
    public required RecursosTenant Recursos { get; init; }
    public required TemaTenant Tema { get; init; }
    public IReadOnlyList<Perfil> PerfisPermitidos { get; init; } = [];
    public IReadOnlyList<TipoPessoa> TiposPessoa { get; init; } = [];
    public IReadOnlyList<TipoVaga> TiposVaga { get; init; } = [];
    public IReadOnlyList<CampoVeiculo> CamposVeiculo { get; init; } = [];

    public bool PossuiRecurso(Recurso recurso) => Recursos.Possui(recurso);
}
