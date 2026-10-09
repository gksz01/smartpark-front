using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Entidades.Vagas;

/// <summary>Produto concreto: vaga com carregador, com tempo limitado para liberar a recarga a outros veículos.</summary>
public class VagaEletrica(int id, string tenantId, string codigo, string setor, StatusVaga status = StatusVaga.Livre)
    : Vaga(id, tenantId, codigo, setor, TipoVaga.Eletrica, status)
{
    public override string RequisitoDeUso() => "Exclusiva para veículos elétricos em recarga";

    public const int LimiteRecargaHoras = 4;

    public override int? PermanenciaMaximaHoras() => LimiteRecargaHoras;
}
