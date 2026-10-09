using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Vagas;

/// <summary>Requisito vem do comportamento próprio de cada subclasse de Vaga.</summary>
public sealed record VagaDto(int Id, string Codigo, string Setor, TipoVaga Tipo, StatusVaga Status, string Requisito)
{
    public static VagaDto De(Vaga vaga) => new(vaga.Id, vaga.Codigo, vaga.Setor, vaga.Tipo, vaga.Status, vaga.RequisitoDeUso());
}
