import { describe, expect, it } from 'vitest'
import { addDaysISO, formatDate, todayISO } from './date'
import { displayPhone, toInternationalPhone, whatsappLink } from './phone'

describe('phone numbers', () => {
  it('turns Ghanaian local numbers into international numbers', () => {
    expect(toInternationalPhone('024 555 0192')).toBe('233245550192')
    expect(toInternationalPhone('+233 24 555 0192')).toBe('233245550192')
    expect(toInternationalPhone('233245550192')).toBe('233245550192')
  })

  it('rejects empty or impossibly short numbers', () => {
    expect(toInternationalPhone('')).toBeNull()
    expect(toInternationalPhone('123')).toBeNull()
  })

  it('formats local and international numbers for display', () => {
    expect(displayPhone('0245550192')).toBe('024 555 0192')
    expect(displayPhone('233245550192')).toBe('+233 245 550 192')
    expect(displayPhone('+44 7700 900123')).toBe('+44 7700 900123')
  })

  it('builds an encoded WhatsApp link', () => {
    const link = whatsappLink('0245550192', 'Hello Ama & Kofi')
    expect(link).toBe('https://wa.me/233245550192?text=Hello%20Ama%20%26%20Kofi')
    expect(whatsappLink('', 'Hello')).toBeNull()
  })
})

describe('dates', () => {
  it('adds days across month boundaries', () => {
    expect(addDaysISO('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('formats today and yesterday in plain language', () => {
    const today = todayISO()
    expect(formatDate(today)).toBe('Today')
    expect(formatDate(addDaysISO(today, -1))).toBe('Yesterday')
  })
})
