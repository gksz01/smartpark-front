using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Aplicacao.Pessoas.Criar;

public sealed class CriarPessoaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<PessoaDto>> ExecutarAsync(CriarPessoaComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId) is { } erroTenant) return Resultado<PessoaDto>.Falha(erroTenant);
        var dados = comando.Dados;
        if (PessoaValidador.Validar(dados, RegistroTenants.Obter(comando.TenantId)) is { } erro) return Resultado<PessoaDto>.Falha(erro);

        var documento = dados.Documento.Trim();
        if (await contexto.Usuarios.AnyAsync(item => item.TenantId == comando.TenantId && item.Documento == documento, cancellationToken))
            return Resultado<PessoaDto>.Falha($"Já existe uma pessoa com o documento {documento} neste cliente.");

        var usuario = new Usuario(0, comando.TenantId, dados.Nome.Trim(), documento, dados.Perfil, dados.Tipo, dados.Ativo);
        contexto.Usuarios.Add(usuario);
        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado<PessoaDto>.Ok(PessoaDto.De(usuario));
    }
}
