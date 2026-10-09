using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.LinhaDeProduto;

/// <summary>Conjunto de recursos ligados para um tenant. O que não foi informado fica desligado.</summary>
public sealed class RecursosTenant
{
    private readonly HashSet<Recurso> _habilitados;

    public RecursosTenant(params Recurso[] habilitados)
    {
        _habilitados = [.. habilitados];
    }

    public bool Possui(Recurso recurso) => _habilitados.Contains(recurso);
}
