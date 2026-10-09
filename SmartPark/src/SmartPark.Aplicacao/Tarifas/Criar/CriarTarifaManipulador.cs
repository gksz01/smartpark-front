using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Padroes.Estrategia.Tarifas;

namespace SmartPark.Aplicacao.Tarifas.Criar;

/// <summary>STRATEGY: o tipo escolhido na tela vira a estratégia concreta que a Tarifa vai usar.</summary>
public sealed class CriarTarifaManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<TarifaDto>> ExecutarAsync(CriarTarifaComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.Cobranca) is { } erroTenant) return Resultado<TarifaDto>.Falha(erroTenant);
        var dados = comando.Dados;
        if (TarifaValidador.Validar(dados) is { } erro) return Resultado<TarifaDto>.Falha(erro);

        var estrategia = EstrategiaTarifaPorTipo.Criar(new ConfiguracaoTarifa(dados.TipoEstrategia, dados.Valor, dados.ValorMaximoDiario));
        var tarifa = new Tarifa(0, comando.TenantId, dados.Nome.Trim(), estrategia, dados.Ativa);
        contexto.Tarifas.Add(tarifa);
        await AtivacaoTarifa.SalvarAsync(contexto, tarifa, cancellationToken);
        return Resultado<TarifaDto>.Ok(TarifaDto.De(tarifa));
    }
}
