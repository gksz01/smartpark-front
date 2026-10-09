using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;

namespace SmartPark.Dominio.Padroes.Fabrica.Vagas;

/// <summary>Creator concreto: decide criar uma VagaComum.</summary>
public class CriadorVagaComum : CriadorVaga
{
    public override Vaga CriarVaga(int id, string tenantId, string codigo, string setor) => new VagaComum(id, tenantId, codigo, setor);
}
