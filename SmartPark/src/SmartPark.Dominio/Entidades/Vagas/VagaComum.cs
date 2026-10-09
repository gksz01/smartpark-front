using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Entidades.Vagas;

/// <summary>Produto concreto: vaga sem restrição, para qualquer veículo.</summary>
public class VagaComum(int id, string tenantId, string codigo, string setor, StatusVaga status = StatusVaga.Livre)
    : Vaga(id, tenantId, codigo, setor, TipoVaga.Comum, status)
{
    public override string RequisitoDeUso() => "Livre para qualquer veículo";

}
