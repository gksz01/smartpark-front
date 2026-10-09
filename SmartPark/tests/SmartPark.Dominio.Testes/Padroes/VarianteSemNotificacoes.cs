using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Padroes.Fabrica.Variantes;

namespace SmartPark.Dominio.Testes.Padroes;

/// <summary>Simula uma variante com Notificacoes desligado (nenhum tenant atual tem essa combinação).</summary>
public class VarianteSemNotificacoes : VarianteShopping
{
    public override bool PossuiRecurso(Recurso recurso) => recurso != Recurso.Notificacoes && base.PossuiRecurso(recurso);
}
