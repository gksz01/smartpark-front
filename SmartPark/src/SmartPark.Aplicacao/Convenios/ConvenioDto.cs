using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Convenios;

public sealed record ConvenioDto(int Id, string Nome, TipoBeneficio TipoBeneficio, int ValorBeneficio, bool Ativo, string Beneficio, int QuantidadeAtendimentos)
{
    public static ConvenioDto De(Convenio convenio, int quantidadeAtendimentos) => new(convenio.Id, convenio.Nome, convenio.TipoBeneficio,
        convenio.ValorBeneficio, convenio.Ativo, convenio.DescricaoBeneficio(), quantidadeAtendimentos);
}
