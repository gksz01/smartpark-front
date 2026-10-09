using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Dominio.Eventos;

/// <summary>Emitido pelo Sensor quando a presença de veículo na vaga muda.</summary>
public sealed record EventoSensor(TipoEventoSensor Tipo, string CodigoSensor, int VagaId, DateTime Momento);
