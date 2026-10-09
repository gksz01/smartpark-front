using System.Text.RegularExpressions;

namespace SmartPark.Dominio.Entidades;

/// <summary>
/// Veículo cadastrado por um usuário.
/// TagRfid e Unidade são os campos extras de CamposVeiculo (Empresa e Condomínio).
/// </summary>
public partial class Veiculo
{
    public int Id { get; private set; }
    public string TenantId { get; private set; }
    public string Placa { get; private set; }
    public string Modelo { get; private set; }
    public string Cor { get; private set; }
    public string Apelido { get; private set; }
    public int? UsuarioId { get; private set; }
    public string? TagRfid { get; private set; }
    public string? Unidade { get; private set; }

    public Veiculo(int id, string tenantId, string placa, string modelo, string cor, string apelido, int? usuarioId = null, string? tagRfid = null, string? unidade = null)
    {
        Id = id;
        TenantId = tenantId;
        Placa = placa;
        Modelo = modelo;
        Cor = cor;
        Apelido = apelido;
        UsuarioId = usuarioId;
        TagRfid = tagRfid;
        Unidade = unidade;
    }

    // Usado pelo EF Core ao ler do banco.
    private Veiculo() : this(0, "", "", "", "", "") { }

    /// <summary>Placa em maiúsculas, sem hífen e sem espaços.</summary>
    public string PlacaNormalizada() => SeparadoresPlaca().Replace(Placa.ToUpperInvariant(), "");

    public bool ValidarPlaca() => PlacaAntiga().IsMatch(PlacaNormalizada()) || PlacaMercosul().IsMatch(PlacaNormalizada());

    public bool EhPlacaMercosul() => PlacaMercosul().IsMatch(PlacaNormalizada());

    /// <summary>Padrão antigo com hífen (ABC-1234); Mercosul sem hífen (ABC1D23).</summary>
    public string PlacaFormatada()
    {
        var placa = PlacaNormalizada();
        return PlacaAntiga().IsMatch(placa) ? $"{placa[..3]}-{placa[3..]}" : placa;
    }

    public string Descricao() => $"{Apelido} · {Modelo} · {PlacaFormatada()}";

    [GeneratedRegex(@"^[A-Z]{3}[0-9]{4}$")]
    private static partial Regex PlacaAntiga();

    [GeneratedRegex(@"^[A-Z]{3}[0-9][A-Z][0-9]{2}$")]
    private static partial Regex PlacaMercosul();

    [GeneratedRegex(@"[-\s]")]
    private static partial Regex SeparadoresPlaca();
}
