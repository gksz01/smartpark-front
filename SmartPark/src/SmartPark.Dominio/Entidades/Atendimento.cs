using System.Text.RegularExpressions;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Dominio.Entidades;

/// <summary>Atendimento hospitalar de um paciente, usado para validar o benefício do convênio.</summary>
public partial class Atendimento
{
    private const int ValidadeHoras = 24;

    public int Id { get; private set; }
    public string TenantId { get; private set; }
    public string Numero { get; private set; }
    public string Paciente { get; private set; }
    public int ConvenioId { get; private set; }
    public Convenio Convenio { get; private set; }
    public DateTime DataAtendimento { get; private set; }
    public bool BeneficioAplicado { get; private set; }

    public Atendimento(int id, string tenantId, string numero, string paciente, Convenio convenio, DateTime dataAtendimento, bool beneficioAplicado = false)
    {
        Id = id;
        TenantId = tenantId;
        Numero = numero;
        Paciente = paciente;
        ConvenioId = convenio.Id;
        Convenio = convenio;
        DataAtendimento = dataAtendimento;
        BeneficioAplicado = beneficioAplicado;
    }

    // Usado pelo EF Core ao ler do banco; o Convenio é carregado pelo Include.
    private Atendimento()
    {
        TenantId = Numero = Paciente = "";
        Convenio = null!;
    }

    /// <summary>
    /// Elegível quando: número no formato correto, convênio ativo,
    /// atendimento nas últimas 24 horas e benefício ainda não utilizado.
    /// </summary>
    public bool ValidarElegibilidade(DateTime agora) => MotivoInelegibilidade(agora) is null;

    /// <summary>Mesmas regras de ValidarElegibilidade(), dizendo qual delas falhou (null = elegível).</summary>
    public string? MotivoInelegibilidade(DateTime agora)
    {
        var horasDesdeAtendimento = (agora - DataAtendimento).TotalHours;
        if (!FormatoAtendimento().IsMatch(Numero)) return "O número do atendimento deve seguir o formato ATD-00000.";
        if (!Convenio.Ativo) return $"O convênio {Convenio.Nome} está inativo.";
        if (horasDesdeAtendimento < 0) return "O atendimento ainda não aconteceu.";
        if (horasDesdeAtendimento > ValidadeHoras) return $"O atendimento tem mais de {ValidadeHoras} horas.";
        if (BeneficioAplicado) return "O benefício deste atendimento já foi utilizado.";
        return null;
    }

    /// <summary>Marca o benefício como utilizado, impedindo o uso duplicado.</summary>
    public void ConsumirBeneficio(DateTime agora)
    {
        if (!ValidarElegibilidade(agora))
            throw new RegraDeNegocioException($"O atendimento {Numero} não está elegível para o benefício.");
        BeneficioAplicado = true;
    }

    [GeneratedRegex(@"^ATD-\d{5}$")]
    private static partial Regex FormatoAtendimento();
}
