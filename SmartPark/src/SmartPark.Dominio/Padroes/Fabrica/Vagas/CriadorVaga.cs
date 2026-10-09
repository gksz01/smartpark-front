using SmartPark.Dominio.Entidades;

namespace SmartPark.Dominio.Padroes.Fabrica.Vagas;

/// <summary>
/// FACTORY METHOD — Exemplo 1: criação de vagas.
/// Creator abstrato. Declara o Factory Method CriarVaga(), mas NÃO decide
/// qual subclasse de Vaga será criada: cada Creator concreto decide.
/// </summary>
public abstract class CriadorVaga
{
    public abstract Vaga CriarVaga(int id, string tenantId, string codigo, string setor);

    /// <summary>Operação comum: usa o Factory Method sem saber qual tipo concreto de vaga é criado.</summary>
    public Vaga CadastrarVaga(Estacionamento estacionamento, int id, string codigo, string setor)
    {
        var vaga = CriarVaga(id, estacionamento.TenantId, codigo, setor);
        estacionamento.AdicionarVaga(vaga);
        return vaga;
    }
}
