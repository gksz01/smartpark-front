namespace SmartPark.Aplicacao.Reservas;

public static class ReservaValidador
{
    public const int DuracaoMaximaHoras = 24;

    public static string? ValidarDuracao(int duracaoHoras) =>
        duracaoHoras is < 1 or > DuracaoMaximaHoras ? $"A duração deve ser um número inteiro de 1 a {DuracaoMaximaHoras} horas." : null;
}
