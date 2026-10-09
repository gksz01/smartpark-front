using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Reservas;

public sealed record ReservaDto(int Id, int VeiculoId, string Veiculo, int VagaId, string CodigoVaga, DateOnly Data, TimeOnly Hora,
    int DuracaoHoras, decimal ValorEstimado, StatusReserva Status)
{
    public static ReservaDto De(Reserva reserva, Veiculo veiculo, Vaga vaga) => new(reserva.Id, veiculo.Id, $"{veiculo.Apelido} · {veiculo.Placa}",
        vaga.Id, vaga.Codigo, reserva.Data, reserva.Hora, reserva.DuracaoHoras, reserva.ValorEstimado, reserva.Status);
}
