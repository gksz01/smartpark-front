using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Entidades.Vagas;

/// <summary>Produto concreto: vaga reservada a pessoas com deficiência.</summary>
public class VagaPCD(int id, string tenantId, string codigo, string setor, StatusVaga status = StatusVaga.Livre)
    : Vaga(id, tenantId, codigo, setor, TipoVaga.PCD, status)
{
    public override string RequisitoDeUso() => "Exige credencial PCD visível no veículo";

}
