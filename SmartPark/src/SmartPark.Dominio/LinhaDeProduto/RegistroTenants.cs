using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.LinhaDeProduto.Tipos;

namespace SmartPark.Dominio.LinhaDeProduto;

/// <summary>Definição central das quatro variantes do SmartPark.</summary>
public static class RegistroTenants
{
    public const string Shopping = "shopping";
    public const string Condominio = "condominium";
    public const string Hospital = "hospital";
    public const string Empresa = "company";

    /// <summary>Na ordem em que aparecem na tela de seleção.</summary>
    public static IReadOnlyList<DefinicaoTenant> Todos { get; } =
    [
        new DefinicaoTenant
        {
            Identificador = Shopping,
            Nome = "Shopping Center Aurora",
            NomeCurto = "Aurora",
            Logo = "AU",
            Chamada = "Mobilidade que acompanha você",
            BoasVindas = "Sua vaga, do seu jeito.",
            MetodoAcesso = MetodoAcesso.Lpr,
            Recursos = new RecursosTenant(Recurso.Reserva, Recurso.Pagamentos, Recurso.Manobrista, Recurso.Cobranca, Recurso.Relatorios, Recurso.Notificacoes, Recurso.WhiteLabel),
            PerfisPermitidos = [Perfil.Motorista, Perfil.Operador, Perfil.Administrador, Perfil.Manobrista],
            Tema = new TemaTenant("#13795b", "#0b503d", "#e9a23b", "#65c18c", "#edf8f3", "#ffffff"),
            TiposPessoa = [TipoPessoa.Motorista, TipoPessoa.Funcionario],
            TiposVaga = [TipoVaga.Comum, TipoVaga.PCD, TipoVaga.Eletrica],
        },
        new DefinicaoTenant
        {
            Identificador = Condominio,
            Nome = "Residencial Horizonte",
            NomeCurto = "Horizonte",
            Logo = "RH",
            Chamada = "Acesso seguro, convivência tranquila",
            BoasVindas = "Chegar em casa ficou mais simples.",
            MetodoAcesso = MetodoAcesso.QrCode,
            Recursos = new RecursosTenant(Recurso.GestaoVisitantes, Recurso.Relatorios, Recurso.Notificacoes, Recurso.WhiteLabel),
            PerfisPermitidos = [Perfil.Morador, Perfil.Visitante, Perfil.Operador, Perfil.Administrador],
            Tema = new TemaTenant("#2463a9", "#173f72", "#6aa9e8", "#f1a84b", "#edf5fc", "#ffffff"),
            CamposVeiculo = [new CampoVeiculo("unidade", "Unidade / apartamento", "Ex.: Torre B · 804")],
            TiposPessoa = [TipoPessoa.Morador, TipoPessoa.Visitante],
            TiposVaga = [TipoVaga.Nominal, TipoVaga.Comum, TipoVaga.PCD],
        },
        new DefinicaoTenant
        {
            Identificador = Hospital,
            Nome = "Hospital Santa Clara",
            NomeCurto = "Santa Clara",
            Logo = "SC",
            Chamada = "Cuidado em todos os momentos",
            BoasVindas = "Acesso acolhedor e sem demora.",
            MetodoAcesso = MetodoAcesso.Lpr,
            Recursos = new RecursosTenant(Recurso.Pagamentos, Recurso.ConvenioMedico, Recurso.Cobranca, Recurso.Relatorios, Recurso.Notificacoes, Recurso.WhiteLabel),
            PerfisPermitidos = [Perfil.Motorista, Perfil.Visitante, Perfil.Funcionario, Perfil.Operador, Perfil.Administrador],
            Tema = new TemaTenant("#087c82", "#07585f", "#3aa6a0", "#7dc8b8", "#eaf7f6", "#ffffff"),
            TiposPessoa = [TipoPessoa.Paciente, TipoPessoa.Acompanhante],
            TiposVaga = [TipoVaga.Prioritaria, TipoVaga.Comum, TipoVaga.PCD],
        },
        new DefinicaoTenant
        {
            Identificador = Empresa,
            Nome = "Nexora Tecnologia",
            NomeCurto = "Nexora",
            Logo = "NX",
            Chamada = "Operação que flui com o seu time",
            BoasVindas = "Seu acesso corporativo em um só lugar.",
            MetodoAcesso = MetodoAcesso.Rfid,
            Recursos = new RecursosTenant(Recurso.GestaoVisitantes, Recurso.Relatorios, Recurso.Notificacoes, Recurso.WhiteLabel),
            PerfisPermitidos = [Perfil.Funcionario, Perfil.Visitante, Perfil.Operador, Perfil.Administrador],
            Tema = new TemaTenant("#34445d", "#1d293b", "#687b98", "#df8e48", "#eef1f5", "#ffffff"),
            CamposVeiculo = [new CampoVeiculo("tagRfid", "Tag RFID", "Ex.: NX-92841")],
            TiposPessoa = [TipoPessoa.Funcionario, TipoPessoa.Visitante],
            TiposVaga = [TipoVaga.Comum, TipoVaga.PCD, TipoVaga.Eletrica, TipoVaga.Restrita],
        },
    ];

    public static bool Existe(string identificador) => Todos.Any(tenant => tenant.Identificador == identificador);

    public static DefinicaoTenant Obter(string identificador) =>
        Todos.FirstOrDefault(tenant => tenant.Identificador == identificador)
        ?? throw new EntidadeNaoEncontradaException($"Tenant {identificador} não encontrado.");
}
