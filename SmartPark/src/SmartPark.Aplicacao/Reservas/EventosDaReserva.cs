using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.LinhaDeProduto;
using SmartPark.Dominio.Padroes.Fabrica.Variantes;
using SmartPark.Dominio.Padroes.Observador;
using SmartPark.Dominio.Padroes.Observador.Reservas;

namespace SmartPark.Aplicacao.Reservas;

/// <summary>
/// OBSERVER — monta o Subject EventosReserva com os observadores da vaga e, se o recurso
/// Notificacoes estiver ligado, de notificação. Os observers mudam a Vaga em memória;
/// o caso de uso grava a mudança junto com a reserva no mesmo SaveChanges.
/// </summary>
internal static class EventosDaReserva
{
    public static EventosReserva Montar(string tenantId, Vaga vaga, List<Notificacao> notificacoes)
    {
        var estacionamento = new Estacionamento(0, tenantId, RegistroTenants.Obter(tenantId).Nome, "", vagas: [vaga]);
        return RegistroObservadores.CriarEventosReserva(estacionamento, VariantePorTenant.Obter(tenantId), notificacoes);
    }
}
