import { describe, expect, it } from 'vitest'
import { formatarDataIso, formatarHora, formatarMoeda } from './formatacao'

describe('formatação compartilhada', () => {
  it('formata moeda em reais', () => {
    expect(formatarMoeda(12)).toBe('R$ 12,00')
    expect(formatarMoeda(50.4)).toBe('R$ 50,40')
    expect(formatarMoeda(0)).toBe('R$ 0,00')
  })

  it('formata hora como HH:MM', () => {
    expect(formatarHora(new Date(2026, 9, 5, 9, 5))).toBe('09:05')
  })

  it('formata data no padrão AAAA-MM-DD', () => {
    expect(formatarDataIso(new Date(2026, 0, 7))).toBe('2026-01-07')
  })
})
