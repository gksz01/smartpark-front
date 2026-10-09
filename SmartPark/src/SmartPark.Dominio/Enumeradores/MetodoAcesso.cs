namespace SmartPark.Dominio.Enumeradores;

/// <summary>Como o tenant identifica quem entra: placa (LPR), tag RFID, QR Code ou liberação manual.</summary>
public enum MetodoAcesso
{
    Lpr,
    Rfid,
    QrCode,
    Manual,
}
