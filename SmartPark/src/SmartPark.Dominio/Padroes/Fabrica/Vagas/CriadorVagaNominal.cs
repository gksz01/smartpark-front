using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;

namespace SmartPark.Dominio.Padroes.Fabrica.Vagas;

/// <summary>Creator concreto: decide criar uma VagaNominal.</summary>
public class CriadorVagaNominal : CriadorVaga
{
    public override Vaga CriarVaga(int id, string tenantId, string codigo, string setor) => new VagaNominal(id, tenantId, codigo, setor);
}
