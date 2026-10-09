using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Aplicacao.Vagas.Atualizar;

public sealed class AtualizarVagaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<VagaDto>> ExecutarAsync(AtualizarVagaComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId) is { } erroTenant) return Resultado<VagaDto>.Falha(erroTenant);
        var dados = comando.Dados;
        if (VagaValidador.Validar(dados, RegistroTenants.Obter(comando.TenantId)) is { } erro) return Resultado<VagaDto>.Falha(erro);

        var vaga = await contexto.Vagas.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (vaga is null) return Resultado<VagaDto>.Falha("Vaga não encontrada.");

        // A vaga é um produto do Factory Method: a subclasse (o tipo) é definida na criação
        if (dados.Tipo != vaga.Tipo)
            return Resultado<VagaDto>.Falha("O tipo da vaga não pode ser alterado. Exclua a vaga e cadastre outra do tipo desejado.");

        var codigo = dados.Codigo.Trim().ToUpperInvariant();
        if (await contexto.Vagas.AnyAsync(item => item.TenantId == comando.TenantId && item.Codigo == codigo && item.Id != vaga.Id, cancellationToken))
            return Resultado<VagaDto>.Falha($"Já existe uma vaga com o código {codigo} neste cliente.");

        try
        {
            vaga.Atualizar(codigo, dados.Setor.Trim());
            vaga.AlterarStatus(dados.Status);
        }
        catch (RegraDeNegocioException falha)
        {
            return Resultado<VagaDto>.Falha(falha.Message);
        }

        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado<VagaDto>.Ok(VagaDto.De(vaga));
    }
}
