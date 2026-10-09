using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Entidades.Vagas;

/// <summary>Produto concreto: vaga do Condomínio vinculada a uma unidade (apartamento).</summary>
public class VagaNominal(int id, string tenantId, string codigo, string setor, StatusVaga status = StatusVaga.Livre)
    : Vaga(id, tenantId, codigo, setor, TipoVaga.Nominal, status)
{
    public override string RequisitoDeUso() => "Exclusiva do morador da unidade vinculada";

}
