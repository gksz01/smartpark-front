using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Aplicacao.Acessos.Criar;

public sealed class CriarAcessoManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<AcessoDto>> ExecutarAsync(CriarAcessoComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId) is { } erroTenant) return Resultado<AcessoDto>.Falha(erroTenant);
        var dados = comando.Dados;
        if (AcessoValidador.Validar(dados) is { } erro) return Resultado<AcessoDto>.Falha(erro);

        // Registro manual: nasce com o método do tenant, horário atual e Pendente, e a classe Acesso decide o status
        var metodo = RegistroTenants.Obter(comando.TenantId).MetodoAcesso;
        var acesso = new Acesso(0, comando.TenantId, dados.Pessoa.Trim(), dados.Identificador.Trim().ToUpperInvariant(), metodo, dados.Direcao, manual: true, DateTime.Now);
        try
        {
            acesso.AlterarStatus(dados.Status, dados.MotivoNegacao);
        }
        catch (RegraDeNegocioException falha)
        {
            return Resultado<AcessoDto>.Falha(falha.Message);
        }

        contexto.Acessos.Add(acesso);
        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado<AcessoDto>.Ok(AcessoDto.De(acesso));
    }
}
