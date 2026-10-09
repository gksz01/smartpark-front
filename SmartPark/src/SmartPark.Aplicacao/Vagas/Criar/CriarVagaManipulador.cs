using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.LinhaDeProduto;
using SmartPark.Dominio.Padroes.Fabrica.Vagas;

namespace SmartPark.Aplicacao.Vagas.Criar;

/// <summary>FACTORY METHOD em uso: o tipo escolhido na tela decide o Creator, e o Creator cria a subclasse de Vaga.</summary>
public sealed class CriarVagaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<VagaDto>> ExecutarAsync(CriarVagaComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId) is { } erroTenant) return Resultado<VagaDto>.Falha(erroTenant);
        var dados = comando.Dados;
        if (VagaValidador.Validar(dados, RegistroTenants.Obter(comando.TenantId)) is { } erro) return Resultado<VagaDto>.Falha(erro);

        var codigo = dados.Codigo.Trim().ToUpperInvariant();
        if (await contexto.Vagas.AnyAsync(item => item.TenantId == comando.TenantId && item.Codigo == codigo, cancellationToken))
            return Resultado<VagaDto>.Falha($"Já existe uma vaga com o código {codigo} neste cliente.");

        var vaga = CriadorVagaPorTipo.Obter(dados.Tipo).CriarVaga(0, comando.TenantId, codigo, dados.Setor.Trim());
        try
        {
            vaga.AlterarStatus(dados.Status);
        }
        catch (RegraDeNegocioException falha)
        {
            return Resultado<VagaDto>.Falha(falha.Message);
        }

        contexto.Vagas.Add(vaga);
        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado<VagaDto>.Ok(VagaDto.De(vaga));
    }
}
