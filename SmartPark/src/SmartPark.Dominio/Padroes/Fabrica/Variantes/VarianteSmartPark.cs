using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.LinhaDeProduto;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Dominio.Padroes.Fabrica.Variantes;

/// <summary>
/// FACTORY METHOD — Exemplo 2: variantes da Linha de Produto SmartPark.
/// Creator abstrato. Cada variante (Shopping, Hospital, Condomínio, Empresa)
/// decide QUAIS objetos de domínio criar, sobrescrevendo os Factory Methods.
/// Recursos, perfis e tema continuam vindo de RegistroTenants, sem cópia.
/// </summary>
public abstract class VarianteSmartPark(string tenantId)
{
    public string TenantId { get; } = tenantId;

    public DefinicaoTenant Configuracao() => RegistroTenants.Obter(TenantId);

    // virtual para os testes simularem uma variante com um recurso desligado
    public virtual bool PossuiRecurso(Recurso recurso) => Configuracao().PossuiRecurso(recurso);

    /// <summary>Factory Method: qual estratégia de tarifa esta variante utiliza.</summary>
    public abstract IEstrategiaTarifa CriarEstrategiaTarifa(Convenio? convenio = null);

    /// <summary>Factory Method: qual tipo de vaga é o padrão desta variante.</summary>
    public abstract Vaga CriarVagaPadrao(int id, string codigo, string setor);

    /// <summary>Operação comum: usa o Factory Method e monta a Tarifa (Context do Strategy).</summary>
    public Tarifa CriarTarifa(int id, Convenio? convenio = null) =>
        new(id, TenantId, $"Tarifa {Configuracao().NomeCurto}", CriarEstrategiaTarifa(convenio));
}
