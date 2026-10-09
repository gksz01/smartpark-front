using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Aplicacao.Veiculos.Atualizar;

public sealed class AtualizarVeiculoManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<VeiculoDto>> ExecutarAsync(AtualizarVeiculoComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId) is { } erroTenant) return Resultado<VeiculoDto>.Falha(erroTenant);
        var dados = comando.Dados;
        if (VeiculoValidador.Validar(dados, RegistroTenants.Obter(comando.TenantId)) is { } erro) return Resultado<VeiculoDto>.Falha(erro);

        // Filtrar pelo tenant impede alterar o veículo de outro cliente
        var veiculo = await contexto.Veiculos.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (veiculo is null) return Resultado<VeiculoDto>.Falha("Veículo não encontrado.");

        veiculo.Atualizar(dados.Placa.Trim(), dados.Modelo.Trim(), dados.Cor.Trim(), dados.Apelido.Trim(), dados.TagRfid?.Trim(), dados.Unidade?.Trim());
        if (await contexto.Veiculos.AnyAsync(item => item.TenantId == comando.TenantId && item.Placa == veiculo.Placa && item.Id != veiculo.Id, cancellationToken))
            return Resultado<VeiculoDto>.Falha($"Já existe um veículo com a placa {veiculo.Placa} neste cliente.");

        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado<VeiculoDto>.Ok(VeiculoDto.De(veiculo));
    }
}
