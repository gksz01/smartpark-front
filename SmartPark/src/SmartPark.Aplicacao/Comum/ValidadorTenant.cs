using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Aplicacao.Comum;

/// <summary>
/// Todo caso de uso começa aqui: o tenant precisa existir e, se a funcionalidade pertence
/// a um recurso (Cobranca, Reserva, ConvenioMedico), ele precisa estar ligado.
/// A tela esconde o recurso desligado, mas a regra não pode depender só da tela.
/// </summary>
public static class ValidadorTenant
{
    /// <summary>Devolve a mensagem de erro, ou null quando o tenant pode usar a funcionalidade.</summary>
    public static string? Validar(string tenantId, Recurso? recurso = null)
    {
        if (!RegistroTenants.Existe(tenantId)) return "Informe um tenant válido.";

        var tenant = RegistroTenants.Obter(tenantId);
        if (recurso is Recurso necessario && !tenant.PossuiRecurso(necessario))
            return $"O módulo {Rotulos.De(necessario)} não está disponível para {tenant.Nome}.";
        return null;
    }
}
