namespace SmartPark.Dominio.Excecoes;

/// <summary>Já existe uma reserva ativa que conflita com a pedida.</summary>
public class ConflitoDeReservaException(string mensagem) : Exception(mensagem);
