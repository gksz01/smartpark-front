using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Dominio.Entidades;

/// <summary>
/// Pessoa que utiliza o SmartPark em algum tenant.
/// O perfil define as permissões; o tipo descreve quem a pessoa é no local.
/// </summary>
public class Usuario
{
    public int Id { get; private set; }
    public string TenantId { get; private set; }
    public string Nome { get; private set; }
    public string Documento { get; private set; }
    public Perfil Perfil { get; private set; }
    public TipoPessoa Tipo { get; private set; }
    public bool Ativo { get; private set; }

    public Usuario(int id, string tenantId, string nome, string documento, Perfil perfil, TipoPessoa tipo, bool ativo = true)
    {
        Id = id;
        TenantId = tenantId;
        Nome = nome;
        Documento = documento;
        Perfil = perfil;
        Tipo = tipo;
        Ativo = ativo;
    }

    // Usado pelo EF Core ao ler do banco.
    private Usuario() : this(0, "", "", "", Perfil.Visitante, TipoPessoa.Visitante) { }

    public bool PossuiPermissao(Permissao permissao) => Ativo && PermissoesPorPerfil.Possui(Perfil, permissao);

    public bool EhVisitante() => Tipo == TipoPessoa.Visitante || Perfil == Perfil.Visitante;

    public bool EhPacienteOuAcompanhante() => Tipo is TipoPessoa.Paciente or TipoPessoa.Acompanhante;

    public string PrimeiroNome() => Nome.Trim().Split(' ')[0];

    public void Desativar() => Ativo = false;
}
