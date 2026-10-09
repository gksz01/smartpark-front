using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Aplicacao.Convenios.Criar;

public sealed class CriarConvenioManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<ConvenioDto>> ExecutarAsync(CriarConvenioComando comando, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(comando.TenantId, Recurso.ConvenioMedico) is { } erroTenant) return Resultado<ConvenioDto>.Falha(erroTenant);
        var dados = comando.Dados;
        if (string.IsNullOrWhiteSpace(dados.Nome)) return Resultado<ConvenioDto>.Falha("Informe o campo Nome.");

        var nome = dados.Nome.Trim();
        if (await contexto.Convenios.AnyAsync(item => item.TenantId == comando.TenantId && item.Nome == nome, cancellationToken))
            return Resultado<ConvenioDto>.Falha($"Já existe um convênio chamado {nome} neste cliente.");

        Convenio convenio;
        try
        {
            convenio = new Convenio(0, comando.TenantId, nome, dados.TipoBeneficio, dados.ValorBeneficio, dados.Ativo); // valida o valor do benefício
        }
        catch (RegraDeNegocioException falha)
        {
            return Resultado<ConvenioDto>.Falha(falha.Message);
        }

        contexto.Convenios.Add(convenio);
        await contexto.SaveChangesAsync(cancellationToken);
        return Resultado<ConvenioDto>.Ok(ConvenioDto.De(convenio, 0));
    }
}
