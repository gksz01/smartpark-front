using SmartPark.Dominio.Enumeradores;
using SmartPark.Dominio.Eventos;
using SmartPark.Dominio.Excecoes;
using SmartPark.Dominio.Padroes.Observador;

namespace SmartPark.Dominio.Entidades;

/// <summary>
/// Sensor instalado em uma vaga que detecta a presença de um veículo.
/// OBSERVER — Exemplo 1: o Sensor é o Subject. Quando o estado muda,
/// notifica os observadores inscritos, sem conhecer quem são.
/// </summary>
public class Sensor : Observavel<EventoSensor>
{
    public int Id { get; private set; }
    public string Codigo { get; private set; }
    public int VagaId { get; private set; }
    public bool Ativo { get; private set; }
    public bool Ocupado { get; private set; }
    public DateTime? UltimaLeitura { get; private set; }

    public Sensor(int id, string codigo, int vagaId, bool ativo = true)
    {
        Id = id;
        Codigo = codigo;
        VagaId = vagaId;
        Ativo = ativo;
    }

    /// <summary>Registra que um veículo foi detectado. Retorna true se o estado mudou.</summary>
    public bool DetectarOcupacao(DateTime? momento = null) => RegistrarLeitura(true, momento ?? DateTime.Now);

    /// <summary>Registra que a vaga ficou vazia. Retorna true se o estado mudou.</summary>
    public bool DetectarLiberacao(DateTime? momento = null) => RegistrarLeitura(false, momento ?? DateTime.Now);

    public void Ativar() => Ativo = true;

    public void Desativar() => Ativo = false;

    private bool RegistrarLeitura(bool ocupado, DateTime momento)
    {
        if (!Ativo)
            throw new RegraDeNegocioException($"O sensor {Codigo} está desativado.");

        var mudou = Ocupado != ocupado;
        Ocupado = ocupado;
        UltimaLeitura = momento;

        // Só avisa os observadores quando o estado realmente muda.
        if (mudou)
            Notificar(new EventoSensor(ocupado ? TipoEventoSensor.Ocupada : TipoEventoSensor.Liberada, Codigo, VagaId, momento));
        return mudou;
    }
}
