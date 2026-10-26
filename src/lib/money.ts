import type { Currency } from '../types'

const SYMBOLS: Record<Currency, string> = {
  GHS: 'GH₵',
  NGN: '₦',
  KES: 'KSh ',
  USD: '$',
  GBP: '£',
}

export const CURRENCIES: { code: Currency; label: string }[] = [
  { code: 'GHS', label: 'Ghana cedi (GH₵)' },
  { code: 'NGN', label: 'Nigerian naira (₦)' },
  { code: 'KES', label: 'Kenyan shilling (KSh)' },
  { code: 'USD', label: 'US dollar ($)' },
  { code: 'GBP', label: 'Pound sterling (£)' },
]

export function currencySymbol(currency: Currency): string {
  return SYMBOLS[currency]
}

export function formatMoney(
  minor: number,
  currency: Currency,
  options?: { signed?: boolean },
): string {
  const negative = minor < 0
  const value = Math.abs(minor) / 100
  const amount = value.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const sign = negative ? '−' : options?.signed && minor > 0 ? '+' : ''
  return `${sign}${SYMBOLS[currency]}${amount}`
}

export function formatMoneyPlain(minor: number): string {
  return (minor / 100).toFixed(2)
}

export function inputFromMinor(minor: number): string {
  return (minor / 100).toFixed(2)
}

/**
 * Parses a human amount into minor units. Accepts "1,240.50", "240" and
 * "GH₵ 240.00". Returns null for anything that is not a positive amount with
 * at most two decimal places.
 */
export function parseMoneyInput(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/[₵$£₦]/g, '')
    .replace(/[A-Za-z]/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '')

  if (!/^\d*\.?\d{0,2}$/.test(cleaned) || cleaned === '' || cleaned === '.') {
    return null
  }

  const [whole = '0', fraction = ''] = cleaned.split('.')
  const minor = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(minor) || minor <= 0) return null
  return minor
}

export function parseMoneyOrZero(raw: string): number | null {
  if (raw.trim() === '') return 0
  return parseMoneyInput(raw)
}
