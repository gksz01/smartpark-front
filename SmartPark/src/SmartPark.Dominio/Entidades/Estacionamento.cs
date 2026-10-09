using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Dominio.Entidades;

/// <summary>Um estacionamento do tenant, composto por um conjunto de vagas.</summary>
public class Estacionamento
{
    private readonly List<Vaga> _vagas;

    public int Id { get; private set; }
    public string TenantId { get; private set; }
    public string Nome { get; private set; }
    public string Endereco { get; private set; }
    public bool Aberto24h { get; private set; }
    public bool Restrito { get; private set; }
    public IReadOnlyList<Vaga> Vagas => _vagas;

    public Estacionamento(int id, string tenantId, string nome, string endereco, bool aberto24h = true, bool restrito = false, IEnumerable<Vaga>? vagas = null)
    {
        Id = id;
        TenantId = tenantId;
        Nome = nome;
        Endereco = endereco;
        Aberto24h = aberto24h;
        Restrito = restrito;
        _vagas = vagas?.ToList() ?? [];
    }

    public void AdicionarVaga(Vaga vaga)
    {
        if (_vagas.Any(item => item.Codigo == vaga.Codigo))
            throw new RegraDeNegocioException($"Já existe uma vaga com o código {vaga.Codigo}.");
        _vagas.Add(vaga);
    }

    public int TotalVagas() => _vagas.Count;

    public int VagasLivres() => _vagas.Count(vaga => vaga.EstaDisponivel());

    /// <summary>Percentual (0 a 100) de vagas que não estão livres.</summary>
    public int TaxaOcupacao()
    {
        if (TotalVagas() == 0) return 0;
        var indisponiveis = TotalVagas() - VagasLivres();
        return (int)Math.Round(indisponiveis * 100m / TotalVagas(), MidpointRounding.AwayFromZero);
    }

    public bool EstaLotado() => VagasLivres() == 0;

    /// <summary>Primeira vaga livre, opcionalmente de um tipo específico.</summary>
    public Vaga? BuscarVagaLivre(TipoVaga? tipo = null) =>
        _vagas.FirstOrDefault(vaga => vaga.EstaDisponivel() && (tipo is null || vaga.Tipo == tipo));
}
