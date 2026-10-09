using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Aplicacao.Acessos.Atualizar;

public sealed class AtualizarAcessoManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<AcessoDto>> ExecutarAsync(AtualizarAcessoComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId) is { } erroTenant) return Resultado<AcessoDto>.Falha(erroTenant);
        var dados = comando.Dados;
        if (AcessoValidador.Validar(dados) is { } erro) return Resultado<AcessoDto>.Falha(erro);

        var acesso = await contexto.Acessos.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (acesso is null) return Resultado<AcessoDto>.Falha("Acesso não encontrado.");

        try
        {
            acesso.Atualizar(dados.Pessoa.Trim(), dados.Identificador.Trim().ToUpperInvariant(), dados.Direcao);
            acesso.AlterarStatus(dados.Status, dados.MotivoNegacao); // um acesso decidido não volta para Pendente
        }
        catch (RegraDeNegocioException falha)
        {
            return Resultado<AcessoDto>.Falha(falha.Message);
        }

        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado<AcessoDto>.Ok(AcessoDto.De(acesso));
    }
}
