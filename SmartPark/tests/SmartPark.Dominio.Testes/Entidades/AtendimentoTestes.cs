using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Dominio.Testes.Entidades;

public class AtendimentoTestes
{
    private static readonly Convenio SaudePlena = new(1, "hospital", "Saúde Plena", TipoBeneficio.Isencao);
    private static readonly DateTime DataAtendimento = new(2026, 9, 5, 9, 0, 0);
    private static readonly DateTime SeisHorasDepois = new(2026, 9, 5, 15, 0, 0);

    [Fact]
    public void ValidarElegibilidade_DeveAceitar_DentroDe24HorasEComNumeroValido()
    {
        var atendimento = new Atendimento(1, "hospital", "ATD-48291", "Helena Moreira", SaudePlena, DataAtendimento);

        Assert.True(atendimento.ValidarElegibilidade(SeisHorasDepois));
        Assert.False(atendimento.ValidarElegibilidade(new DateTime(2026, 9, 6, 10, 0, 0)));
        Assert.False(new Atendimento(2, "hospital", "XYZ-1", "Helena Moreira", SaudePlena, DataAtendimento).ValidarElegibilidade(SeisHorasDepois));
    }

    [Fact]
    public void ValidarElegibilidade_DeveRecusar_QuandoConvenioInativo()
    {
        var inativo = new Convenio(9, "hospital", "Antigo", TipoBeneficio.Isencao, 0, false);

        Assert.False(new Atendimento(1, "hospital", "ATD-48291", "Helena Moreira", inativo, DataAtendimento).ValidarElegibilidade(SeisHorasDepois));
    }

    [Fact]
    public void ConsumirBeneficio_DeveFalhar_QuandoBeneficioJaFoiUsado()
    {
        var atendimento = new Atendimento(1, "hospital", "ATD-48291", "Helena Moreira", SaudePlena, DataAtendimento);

        atendimento.ConsumirBeneficio(SeisHorasDepois);

        Assert.True(atendimento.BeneficioAplicado);
        Assert.Contains("não está elegível", Assert.Throws<RegraDeNegocioException>(() => atendimento.ConsumirBeneficio(SeisHorasDepois)).Message);
    }

    [Fact]
    public void MotivoInelegibilidade_DeveExplicarCadaRegra()
    {
        var agora = new DateTime(2026, 10, 5, 12, 0, 0);
        var duasHorasAtras = new DateTime(2026, 10, 5, 10, 0, 0);
        var inativo = new Convenio(2, "hospital", "Plano Antigo", TipoBeneficio.Percentual, 30, false);

        var elegivel = new Atendimento(1, "hospital", "ATD-48291", "Helena Moreira", SaudePlena, duasHorasAtras);
        var comInativo = new Atendimento(2, "hospital", "ATD-55120", "João Lima", inativo, duasHorasAtras);
        var antigo = new Atendimento(3, "hospital", "ATD-30017", "Marta Dias", SaudePlena, new DateTime(2026, 10, 2, 12, 0, 0));
        var usado = new Atendimento(4, "hospital", "ATD-90442", "Paulo Reis", SaudePlena, duasHorasAtras, beneficioAplicado: true);
        var formato = new Atendimento(5, "hospital", "XYZ", "Ana", SaudePlena, duasHorasAtras);

        Assert.Null(elegivel.MotivoInelegibilidade(agora));
        Assert.True(elegivel.ValidarElegibilidade(agora));
        Assert.Equal("O convênio Plano Antigo está inativo.", comInativo.MotivoInelegibilidade(agora));
        Assert.Equal("O atendimento tem mais de 24 horas.", antigo.MotivoInelegibilidade(agora));
        Assert.Equal("O benefício deste atendimento já foi utilizado.", usado.MotivoInelegibilidade(agora));
        Assert.Equal("O número do atendimento deve seguir o formato ATD-00000.", formato.MotivoInelegibilidade(agora));
        Assert.All(new[] { comInativo, antigo, usado, formato }, atendimento => Assert.False(atendimento.ValidarElegibilidade(agora)));
    }
}
