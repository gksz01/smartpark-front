using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Aplicacao.Veiculos;

/// <summary>Validação do formulário de veículo (criar e alterar usam as mesmas regras).</summary>
public static class VeiculoValidador
{
    public static string? Validar(DadosVeiculo dados, DefinicaoTenant tenant)
    {
        if (string.IsNullOrWhiteSpace(dados.Apelido)) return "Informe o campo Apelido.";
        if (string.IsNullOrWhiteSpace(dados.Placa)) return "Informe o campo Placa.";
        if (string.IsNullOrWhiteSpace(dados.Modelo)) return "Informe o campo Modelo.";
        if (string.IsNullOrWhiteSpace(dados.Cor)) return "Informe o campo Cor.";

        // Campos variáveis da LPS: Unidade no Condomínio, Tag RFID na Empresa
        foreach (var campo in tenant.CamposVeiculo)
        {
            var valor = campo.Chave == "unidade" ? dados.Unidade : dados.TagRfid;
            if (string.IsNullOrWhiteSpace(valor)) return $"Informe o campo {campo.Rotulo}.";
        }

        var veiculo = new Veiculo(0, tenant.Identificador, dados.Placa, dados.Modelo, dados.Cor, dados.Apelido);
        return veiculo.ValidarPlaca() ? null : "Placa inválida. Use o padrão ABC1234 ou ABC1D23.";
    }
}
