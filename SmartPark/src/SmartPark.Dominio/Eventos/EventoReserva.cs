using SmartPark.Dominio.Entidades;
using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Eventos;

/// <summary>Emitido por EventosReserva quando uma reserva é confirmada, alterada ou cancelada.</summary>
public sealed record EventoReserva(TipoEventoReserva Tipo, Reserva Reserva);
