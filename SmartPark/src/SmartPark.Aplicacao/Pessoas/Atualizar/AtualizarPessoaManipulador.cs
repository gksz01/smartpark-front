using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Aplicacao.Pessoas.Atualizar;

public sealed class AtualizarPessoaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<PessoaDto>> ExecutarAsync(AtualizarPessoaComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId) is { } erroTenant) return Resultado<PessoaDto>.Falha(erroTenant);
        var dados = comando.Dados;
        if (PessoaValidador.Validar(dados, RegistroTenants.Obter(comando.TenantId)) is { } erro) return Resultado<PessoaDto>.Falha(erro);

        var usuario = await contexto.Usuarios.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (usuario is null) return Resultado<PessoaDto>.Falha("Pessoa não encontrada.");

        var documento = dados.Documento.Trim();
        if (await contexto.Usuarios.AnyAsync(item => item.TenantId == comando.TenantId && item.Documento == documento && item.Id != usuario.Id, cancellationToken))
            return Resultado<PessoaDto>.Falha($"Já existe uma pessoa com o documento {documento} neste cliente.");

        usuario.Atualizar(dados.Nome.Trim(), documento, dados.Perfil, dados.Tipo, dados.Ativo);
        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado<PessoaDto>.Ok(PessoaDto.De(usuario));
    }
}
