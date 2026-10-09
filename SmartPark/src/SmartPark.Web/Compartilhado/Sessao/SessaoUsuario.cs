using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Web.Compartilhado.Sessao;

/// <summary>
/// Tenant e perfil escolhidos na tela inicial (protótipo sem login real).
/// Vale enquanto a conexão com o servidor estiver aberta; ao recarregar a página, volta para a seleção.
/// </summary>
public sealed class SessaoUsuario
{
    public DefinicaoTenant? Tenant { get; private set; }
    public Perfil Perfil { get; private set; }
    public bool Conectado => Tenant is not null;
    public string TenantId => Tenant?.Identificador ?? "";

    /// <summary>Avisa o layout para trocar tema e menu.</summary>
    public event Action? Mudou;

    public void Entrar(string tenantId, Perfil perfil)
    {
        Tenant = RegistroTenants.Obter(tenantId);
        Perfil = perfil;
        Mudou?.Invoke();
    }

    public void Sair()
    {
        Tenant = null;
        Mudou?.Invoke();
    }

    /// <summary>O perfil tem a permissão e, quando informado, o tenant tem o recurso ligado.</summary>
    public bool PodeAcessar(Permissao permissao, Recurso? recurso = null) =>
        Tenant is not null
        && PermissoesPorPerfil.Possui(Perfil, permissao)
        && (recurso is not Recurso necessario || Tenant.PossuiRecurso(necessario));
}
