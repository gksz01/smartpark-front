using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Excecoes;

namespace SmartPark.Dominio.Entidades;

/// <summary>Reserva antecipada de uma vaga para um veículo.</summary>
public class Reserva
{
    /// <summary>Mesma tolerância informada ao usuário na tela de reserva.</summary>
    public const int ToleranciaMinutos = 15;

    public int Id { get; private set; }
    public string TenantId { get; private set; }
    public int VeiculoId { get; private set; }
    public int VagaId { get; private set; }
    public DateOnly Data { get; private set; }
    public TimeOnly Hora { get; private set; }
    public int DuracaoHoras { get; private set; }
    public StatusReserva Status { get; private set; }
    public decimal ValorEstimado { get; private set; }

    public Reserva(int id, string tenantId, int veiculoId, int vagaId, DateOnly data, TimeOnly hora, int duracaoHoras, StatusReserva status = StatusReserva.Pendente, decimal valorEstimado = 0)
    {
        Id = id;
        TenantId = tenantId;
        VeiculoId = veiculoId;
        VagaId = vagaId;
        Data = data;
        Hora = hora;
        DuracaoHoras = duracaoHoras;
        Status = status;
        ValorEstimado = valorEstimado;
    }

    // Usado pelo EF Core ao ler do banco.
    private Reserva() : this(0, "", 0, 0, default, default, 1) { }

    public decimal CalcularEstimativa(Tarifa tarifa)
    {
        ValorEstimado = tarifa.Calcular(DuracaoHoras);
        return ValorEstimado;
    }

    public void Confirmar()
    {
        if (Status != StatusReserva.Pendente)
            throw new RegraDeNegocioException("Apenas reservas pendentes podem ser confirmadas.");
        Status = StatusReserva.Confirmada;
    }

    public void Cancelar()
    {
        if (Status is StatusReserva.Cancelada or StatusReserva.Concluida)
            throw new RegraDeNegocioException($"Uma reserva {Status.ToString().ToLowerInvariant()} não pode ser cancelada.");
        Status = StatusReserva.Cancelada;
    }

    public void Alterar(DateOnly data, TimeOnly hora, int duracaoHoras)
    {
        if (!EstaAtiva())
            throw new RegraDeNegocioException("Apenas reservas pendentes ou confirmadas podem ser alteradas.");
        if (duracaoHoras <= 0)
            throw new RegraDeNegocioException("A duração da reserva deve ser maior que zero.");
        Data = data;
        Hora = hora;
        DuracaoHoras = duracaoHoras;
    }

    public void Concluir()
    {
        if (Status != StatusReserva.Confirmada)
            throw new RegraDeNegocioException("Apenas reservas confirmadas podem ser concluídas.");
        Status = StatusReserva.Concluida;
    }

    public bool EstaAtiva() => Status is StatusReserva.Pendente or StatusReserva.Confirmada;

    public DateTime Inicio() => Data.ToDateTime(Hora);

    /// <summary>Reserva confirmada cujo horário + tolerância já passou sem a entrada do veículo.</summary>
    public bool Expirou(DateTime agora) =>
        Status == StatusReserva.Confirmada && agora > Inicio().AddMinutes(ToleranciaMinutos);
}
