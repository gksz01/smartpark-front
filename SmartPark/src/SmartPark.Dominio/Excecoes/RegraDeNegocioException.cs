namespace SmartPark.Dominio.Excecoes;

/// <summary>Uma regra de negócio do domínio foi violada.</summary>
public class RegraDeNegocioException(string mensagem) : Exception(mensagem);
