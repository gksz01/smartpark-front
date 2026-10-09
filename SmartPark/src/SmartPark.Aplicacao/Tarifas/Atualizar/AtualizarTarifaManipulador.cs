using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Aplicacao.Tarifas.Atualizar;

/// <summary>Editar ou ativar. Trocar o tipo troca a Strategy sem mudar a classe Tarifa.</summary>
public sealed class AtualizarTarifaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<TarifaDto>> ExecutarAsync(AtualizarTarifaComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.Cobranca) is { } erroTenant) return Resultado<TarifaDto>.Falha(erroTenant);
        var dados = comando.Dados;
        if (TarifaValidador.Validar(dados) is { } erro) return Resultado<TarifaDto>.Falha(erro);

        var tarifa = await contexto.Tarifas.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (tarifa is null) return Resultado<TarifaDto>.Falha("Tarifa não encontrada.");

        tarifa.Renomear(dados.Nome.Trim());
        tarifa.DefinirEstrategia(EstrategiaTarifaPorTipo.Criar(new ConfiguracaoTarifa(dados.TipoEstrategia, dados.Valor, dados.ValorMaximoDiario)));
        if (dados.Ativa) tarifa.Ativar();
        else tarifa.Desativar();

        await AtivacaoTarifa.SalvarAsync(contexto, tarifa, cancellationToken);
        return Resultado<TarifaDto>.Ok(TarifaDto.De(tarifa));
    }
}
