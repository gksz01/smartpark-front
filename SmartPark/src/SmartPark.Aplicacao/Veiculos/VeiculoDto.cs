using SmartPark.Dominio.Entidades;

namespace SmartPark.Aplicacao.Veiculos;

public sealed record VeiculoDto(int Id, string Apelido, string Placa, string PlacaFormatada, string Modelo, string Cor, string? Unidade, string? TagRfid)
{
    public static VeiculoDto De(Veiculo veiculo) =>
        new(veiculo.Id, veiculo.Apelido, veiculo.Placa, veiculo.PlacaFormatada(), veiculo.Modelo, veiculo.Cor, veiculo.Unidade, veiculo.TagRfid);
}
