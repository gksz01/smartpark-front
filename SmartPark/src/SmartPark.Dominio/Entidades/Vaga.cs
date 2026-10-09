using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Dominio.Entidades;

/// <summary>
/// Uma vaga física do estacionamento e o seu estado atual.
/// É o Product do Factory Method de vagas: as subclasses em Entidades/Vagas
/// sobrescrevem RequisitoDeUso() e PermanenciaMaximaHoras().
/// É abstrata: toda vaga é criada por um Creator e tem um tipo concreto.
/// </summary>
public abstract class Vaga
{
    public int Id { get; private set; }
    public string TenantId { get; private set; }
    public string Codigo { get; private set; }
    public string Setor { get; private set; }
    public TipoVaga Tipo { get; private set; }
    public StatusVaga Status { get; private set; }

    protected Vaga(int id, string tenantId, string codigo, string setor, TipoVaga tipo, StatusVaga status = StatusVaga.Livre)
    {
        Id = id;
        TenantId = tenantId;
        Codigo = codigo;
        Setor = setor;
        Tipo = tipo;
        Status = status;
    }

    public bool EstaDisponivel() => Status == StatusVaga.Livre;

    /// <summary>Um veículo entrou na vaga. Vagas reservadas também podem ser ocupadas.</summary>
    public void Ocupar()
    {
        if (Status is not (StatusVaga.Livre or StatusVaga.Reservada))
            throw new RegraDeNegocioException($"A vaga {Codigo} não pode ser ocupada (status: {Status}).");
        Status = StatusVaga.Ocupada;
    }

    /// <summary>O veículo saiu ou a reserva foi cancelada.</summary>
    public void Liberar()
    {
        if (Status == StatusVaga.Bloqueada)
            throw new RegraDeNegocioException($"A vaga {Codigo} está bloqueada. Desbloqueie antes de liberar.");
        Status = StatusVaga.Livre;
    }

    public void Reservar()
    {
        if (!EstaDisponivel())
            throw new RegraDeNegocioException($"A vaga {Codigo} não está livre para reserva.");
        Status = StatusVaga.Reservada;
    }

    /// <summary>Manutenção ou interdição. Não é possível bloquear uma vaga ocupada.</summary>
    public void Bloquear()
    {
        if (Status == StatusVaga.Ocupada)
            throw new RegraDeNegocioException($"A vaga {Codigo} está ocupada e não pode ser bloqueada.");
        Status = StatusVaga.Bloqueada;
    }

    public void Desbloquear()
    {
        if (Status == StatusVaga.Bloqueada) Status = StatusVaga.Livre;
    }

    /// <summary>Só é seguro excluir uma vaga sem veículo e sem reserva.</summary>
    public bool PodeSerExcluida() => Status is StatusVaga.Livre or StatusVaga.Bloqueada;

    public bool EhEspecial() => Tipo != TipoVaga.Comum;

    /// <summary>Quem pode usar a vaga. As subclasses sobrescrevem.</summary>
    public virtual string RequisitoDeUso() => "Sem restrição de uso";

    /// <summary>Tempo máximo de permanência em horas; null significa sem limite.</summary>
    public virtual int? PermanenciaMaximaHoras() => null;

    public bool ExcedeuPermanencia(decimal horas) => PermanenciaMaximaHoras() is int maximo && horas > maximo;
}
