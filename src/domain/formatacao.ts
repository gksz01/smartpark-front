/*
 * Formatação compartilhada pelo domínio e pelas telas.
 * Antes, o mesmo código de moeda e hora estava copiado em várias classes e telas.
 */

/** Ex.: 12 → "R$ 12,00" */
export function formatarMoeda(valor: number): string {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

/** Ex.: Date de 14:05 → "14:05" */
export function formatarHora(data: Date): string {
  const horas = String(data.getHours()).padStart(2, '0')
  const minutos = String(data.getMinutes()).padStart(2, '0')
  return `${horas}:${minutos}`
}

/** Ex.: Date de 5 de outubro de 2026 → "2026-10-05" (formato dos campos de data) */
export function formatarDataIso(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}
