using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;

namespace SmartPark.Dominio.Padroes.Fabrica.Vagas;

/// <summary>Creator concreto: decide criar uma VagaPrioritaria.</summary>
public class CriadorVagaPrioritaria : CriadorVaga
{
    public override Vaga CriarVaga(int id, string tenantId, string codigo, string setor) => new VagaPrioritaria(id, tenantId, codigo, setor);
}
