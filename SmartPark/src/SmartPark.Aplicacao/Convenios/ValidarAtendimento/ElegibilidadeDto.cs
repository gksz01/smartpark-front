namespace SmartPark.Aplicacao.Convenios.ValidarAtendimento;

public sealed record ElegibilidadeDto(string Numero, string Paciente, string Convenio, string Beneficio, bool Elegivel, string Motivo);
