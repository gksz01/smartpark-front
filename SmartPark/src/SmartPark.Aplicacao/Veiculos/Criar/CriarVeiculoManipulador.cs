using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.LinhaDeProduto;

namespace SmartPark.Aplicacao.Veiculos.Criar;

public sealed class CriarVeiculoManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<VeiculoDto>> ExecutarAsync(CriarVeiculoComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId) is { } erroTenant) return Resultado<VeiculoDto>.Falha(erroTenant);
        var dados = comando.Dados;
        if (VeiculoValidador.Validar(dados, RegistroTenants.Obter(comando.TenantId)) is { } erro) return Resultado<VeiculoDto>.Falha(erro);

        var veiculo = new Veiculo(0, comando.TenantId, dados.Placa.Trim(), dados.Modelo.Trim(), dados.Cor.Trim(), dados.Apelido.Trim(),
            tagRfid: dados.TagRfid?.Trim(), unidade: dados.Unidade?.Trim());
        // O índice único do banco também recusa; a consulta antes dá uma mensagem clara
        if (await contexto.Veiculos.AnyAsync(item => item.TenantId == comando.TenantId && item.Placa == veiculo.Placa, cancellationToken))
            return Resultado<VeiculoDto>.Falha($"Já existe um veículo com a placa {veiculo.Placa} neste cliente.");

        contexto.Veiculos.Add(veiculo);
        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado<VeiculoDto>.Ok(VeiculoDto.De(veiculo));
    }
}
