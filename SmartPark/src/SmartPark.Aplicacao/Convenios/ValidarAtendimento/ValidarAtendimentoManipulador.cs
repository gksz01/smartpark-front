using Microsoft.EntityFrameworkCore;
using SmartPark.Aplicacao.Comum;
using SmartPark.Compartilhado;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Convenios.ValidarAtendimento;

public sealed class ValidarAtendimentoManipulador(ISmartParkContexto contexto)
{
    public async Task<Resultado<ElegibilidadeDto>> ExecutarAsync(ValidarAtendimentoConsulta consulta, CancellationToken cancellationToken = default)
    {
        if (ValidadorTenant.Validar(consulta.TenantId, Recurso.ConvenioMedico) is { } erro) return Resultado<ElegibilidadeDto>.Falha(erro);

        var numero = consulta.Numero.Trim().ToUpperInvariant();
        if (numero.Length == 0) return Resultado<ElegibilidadeDto>.Falha("Informe o número do atendimento.");

        var atendimento = await contexto.Atendimentos.AsNoTracking().Include(item => item.Convenio)
            .SingleOrDefaultAsync(item => item.TenantId == consulta.TenantId && item.Numero == numero, cancellationToken);
        if (atendimento is null) return Resultado<ElegibilidadeDto>.Falha("Atendimento não localizado.");

        // As regras (formato, convênio ativo, 24h, benefício já usado) estão na classe Atendimento
        var motivo = atendimento.MotivoInelegibilidade(DateTime.Now);
        return Resultado<ElegibilidadeDto>.Ok(new ElegibilidadeDto(atendimento.Numero, atendimento.Paciente, atendimento.Convenio.Nome,
            atendimento.Convenio.DescricaoBeneficio(), motivo is null, motivo ?? ""));
    }
}
