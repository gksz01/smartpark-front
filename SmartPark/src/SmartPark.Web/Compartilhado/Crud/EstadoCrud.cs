namespace SmartPark.Web.Compartilhado.Crud;

/// <summary>
/// Estado repetido em todas as telas de CRUD: modal aberto, item em edição e mensagens.
/// Equivale ao hook useCrudForm da versão React.
/// </summary>
public sealed class EstadoCrud
{
    public bool ModalAberto { get; private set; }
    public int? IdEditando { get; private set; }
    public bool Editando => IdEditando is not null;
    public bool Salvando { get; set; }

    /// <summary>Erro exibido dentro do modal (validação ou regra de negócio).</summary>
    public string? ErroFormulario { get; private set; }

    /// <summary>Mensagens exibidas no topo da tela.</summary>
    public string? Sucesso { get; private set; }
    public string? Erro { get; private set; }

    public void AbrirNovo()
    {
        IdEditando = null;
        AbrirModal();
    }

    public void AbrirEdicao(int id)
    {
        IdEditando = id;
        AbrirModal();
    }

    public void Fechar() => ModalAberto = false;

    /// <summary>Fecha o modal e mostra a mensagem de sucesso, ou mantém aberto com o erro.</summary>
    public bool ConcluirFormulario(bool sucesso, string? erro, string mensagemSucesso)
    {
        Salvando = false;
        if (!sucesso)
        {
            ErroFormulario = erro;
            return false;
        }
        ModalAberto = false;
        InformarSucesso(mensagemSucesso);
        return true;
    }

    /// <summary>Para ações fora do modal (excluir, cancelar, estornar...).</summary>
    public bool ConcluirAcao(bool sucesso, string? erro, string mensagemSucesso)
    {
        if (sucesso) InformarSucesso(mensagemSucesso);
        else InformarErro(erro);
        return sucesso;
    }

    public void InformarSucesso(string mensagem) => (Sucesso, Erro) = (mensagem, null);

    public void InformarErro(string? mensagem) => (Sucesso, Erro) = (null, mensagem);

    private void AbrirModal()
    {
        ErroFormulario = null;
        Salvando = false;
        ModalAberto = true;
    }
}
