namespace SmartPark.Dominio.Excecoes;

/// <summary>O registro procurado não existe (ou pertence a outro tenant).</summary>
public class EntidadeNaoEncontradaException(string mensagem) : Exception(mensagem);
