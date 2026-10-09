using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Entidades.Vagas;

/// <summary>Produto concreto: vaga do Hospital próxima à entrada, para pacientes e acompanhantes.</summary>
public class VagaPrioritaria(int id, string tenantId, string codigo, string setor, StatusVaga status = StatusVaga.Livre)
    : Vaga(id, tenantId, codigo, setor, TipoVaga.Prioritaria, status)
{
    public override string RequisitoDeUso() => "Exclusiva para pacientes e acompanhantes";

    public const int LimiteHoras = 6;

    public override int? PermanenciaMaximaHoras() => LimiteHoras;
}
