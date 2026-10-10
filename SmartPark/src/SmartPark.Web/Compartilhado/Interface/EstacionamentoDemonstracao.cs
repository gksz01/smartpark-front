using SmartPark.Web.Compartilhado.Crud;

namespace SmartPark.Web.Compartilhado.Interface;

/// <summary>Estacionamento exibido no portal de demonstração (mesmo dado fixo da versão React).</summary>
public static class EstacionamentoDemonstracao
{
    public const string Nome = "Estacionamento Central";
    public const string Endereco = "Av. das Palmeiras, 450";

    /// <summary>Opções de período dos formulários de reserva e pagamento.</summary>
    public static IReadOnlyList<OpcaoSelecao> Duracoes(params int[] horas) =>
        horas.Select(hora => new OpcaoSelecao(hora.ToString(), hora == 1 ? "1 hora" : $"{hora} horas")).ToList();
}
