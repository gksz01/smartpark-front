using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.LinhaDeProduto;

/// <summary>Matriz de permissões de cada perfil, igual para todos os tenants.</summary>
public static class PermissoesPorPerfil
{
    private static readonly Dictionary<Perfil, Permissao[]> Matriz = new()
    {
        [Perfil.Motorista] = [Permissao.Portal, Permissao.Veiculos],
        [Perfil.Morador] = [Permissao.Portal, Permissao.Veiculos],
        [Perfil.Funcionario] = [Permissao.Portal, Permissao.Veiculos],
        [Perfil.Visitante] = [Permissao.Portal],
        [Perfil.Operador] = [Permissao.Vagas, Permissao.Acessos, Permissao.ConvenioMedico, Permissao.Usuarios],
        [Perfil.Administrador] = [Permissao.Painel, Permissao.Vagas, Permissao.Acessos, Permissao.Configuracao, Permissao.ConvenioMedico, Permissao.Usuarios],
        [Perfil.Manobrista] = [Permissao.Veiculos, Permissao.Acessos],
    };

    public static bool Possui(Perfil perfil, Permissao permissao) => Matriz[perfil].Contains(permissao);
}
