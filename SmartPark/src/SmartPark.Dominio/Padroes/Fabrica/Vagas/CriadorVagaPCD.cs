using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;

namespace SmartPark.Dominio.Padroes.Fabrica.Vagas;

/// <summary>Creator concreto: decide criar uma VagaPCD.</summary>
public class CriadorVagaPCD : CriadorVaga
{
    public override Vaga CriarVaga(int id, string tenantId, string codigo, string setor) => new VagaPCD(id, tenantId, codigo, setor);
}
