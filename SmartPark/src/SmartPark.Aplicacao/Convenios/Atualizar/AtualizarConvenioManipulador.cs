using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Aplicacao.Convenios.Atualizar;

/// <summary>Inclusive desativar: convênio inativo deixa de tornar atendimentos elegíveis.</summary>
public sealed class AtualizarConvenioManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<ConvenioDto>> ExecutarAsync(AtualizarConvenioComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.ConvenioMedico) is { } erroTenant) return Resultado<ConvenioDto>.Falha(erroTenant);
        var dados = comando.Dados;
        if (string.IsNullOrWhiteSpace(dados.Nome)) return Resultado<ConvenioDto>.Falha("Informe o campo Nome.");

        var convenio = await contexto.Convenios.SingleOrDefaultAsync(item => item.Id == comando.Id && item.TenantId == comando.TenantId, cancellationToken);
        if (convenio is null) return Resultado<ConvenioDto>.Falha("Convênio não encontrado.");

        var nome = dados.Nome.Trim();
        if (await contexto.Convenios.AnyAsync(item => item.TenantId == comando.TenantId && item.Nome == nome && item.Id != convenio.Id, cancellationToken))
            return Resultado<ConvenioDto>.Falha($"Já existe um convênio chamado {nome} neste cliente.");

        try
        {
            convenio.Atualizar(nome, dados.TipoBeneficio, dados.ValorBeneficio, dados.Ativo);
        }
        catch (RegraDeNegocioException falha)
        {
            return Resultado<ConvenioDto>.Falha(falha.Message);
        }

        await contexto.SaveChangesAsync(cancellationToken);
        var atendimentos = await contexto.Atendimentos.CountAsync(atendimento => atendimento.ConvenioId == convenio.Id, cancellationToken);
        return Resultado<ConvenioDto>.Ok(ConvenioDto.De(convenio, atendimentos));
    }
}
