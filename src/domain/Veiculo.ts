const PLACA_ANTIGA = /^[A-Z]{3}[0-9]{4}$/ // ABC1234
const PLACA_MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/ // ABC1D23

/**
 * Veículo cadastrado por um usuário.
 * Os campos opcionais tagRfid e unidade correspondem aos campos extras
 * de vehicleFields (Empresa e Condomínio).
 */
export class Veiculo {
  id: string
  placa: string
  modelo: string
  cor: string
  apelido: string
  usuarioId?: string
  tagRfid?: string
  unidade?: string

  constructor(id: string, placa: string, modelo: string, cor: string, apelido: string, usuarioId?: string, tagRfid?: string, unidade?: string) {
    this.id = id
    this.placa = placa
    this.modelo = modelo
    this.cor = cor
    this.apelido = apelido
    this.usuarioId = usuarioId
    this.tagRfid = tagRfid
    this.unidade = unidade
  }

  /** Placa em maiúsculas, sem hífen e sem espaços. */
  placaNormalizada(): string {
    return this.placa.toUpperCase().replace(/[-\s]/g, '')
  }

  validarPlaca(): boolean {
    const placa = this.placaNormalizada()
    return PLACA_ANTIGA.test(placa) || PLACA_MERCOSUL.test(placa)
  }

  ehPlacaMercosul(): boolean {
    return PLACA_MERCOSUL.test(this.placaNormalizada())
  }

  /** Padrão antigo com hífen (ABC-1234); Mercosul sem hífen (ABC1D23). */
  placaFormatada(): string {
    const placa = this.placaNormalizada()
    if (PLACA_ANTIGA.test(placa)) return `${placa.slice(0, 3)}-${placa.slice(3)}`
    return placa
  }

  descricao(): string {
    return `${this.apelido} · ${this.modelo} · ${this.placaFormatada()}`
  }
}
