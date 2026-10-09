using SmartPark.Dominio.Enumeradores;

namespace SmartPark.Aplicacao.Vagas.SimularSensor;

/// <summary>Simula a leitura do sensor instalado na vaga: Ocupada (veículo chegou) ou Liberada (saiu).</summary>
public sealed record SimularSensorComando(string TenantId, int VagaId, TipoEventoSensor Leitura);
