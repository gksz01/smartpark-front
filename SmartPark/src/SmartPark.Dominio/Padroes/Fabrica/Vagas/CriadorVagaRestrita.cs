using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Entidades.Vagas;

namespace SmartPark.Dominio.Padroes.Fabrica.Vagas;

/// <summary>Creator concreto: decide criar uma VagaRestrita.</summary>
public class CriadorVagaRestrita : CriadorVaga
{
    public override Vaga CriarVaga(int id, string tenantId, string codigo, string setor) => new VagaRestrita(id, tenantId, codigo, setor);
}
