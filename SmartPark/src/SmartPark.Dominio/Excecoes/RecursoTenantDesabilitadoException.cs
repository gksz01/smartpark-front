namespace SmartPark.Dominio.Excecoes;

/// <summary>O recurso pedido está desligado para o tenant.</summary>
public class RecursoTenantDesabilitadoException(string mensagem) : Exception(mensagem);
