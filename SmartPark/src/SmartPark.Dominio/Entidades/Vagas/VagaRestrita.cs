using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Entidades.Vagas;

/// <summary>Produto concreto: vaga de acesso restrito (ex.: diretoria), liberada só a credenciais autorizadas.</summary>
public class VagaRestrita(int id, string tenantId, string codigo, string setor, StatusVaga status = StatusVaga.Livre)
    : Vaga(id, tenantId, codigo, setor, TipoVaga.Restrita, status)
{
    public override string RequisitoDeUso() => "Exclusiva para credenciais autorizadas";

}
