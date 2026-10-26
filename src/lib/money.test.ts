import { describe, expect, it } from 'vitest'
import { formatMoney, inputFromMinor, parseMoneyInput, parseMoneyOrZero } from './money'

describe('parseMoneyInput', () => {
  it('parses whole amounts and decimals into minor units', () => {
    expect(parseMoneyInput('240')).toBe(24000)
    expect(parseMoneyInput('240.5')).toBe(24050)
    expect(parseMoneyInput('240.50')).toBe(24050)
    expect(parseMoneyInput('0.05')).toBe(5)
  })

  it('ignores currency symbols, spaces and thousands separators', () => {
    expect(parseMoneyInput('GH₵ 1,240.50')).toBe(124050)
    expect(parseMoneyInput('₦ 2,000')).toBe(200000)
  })

  it('rejects zero, negatives and more than two decimals', () => {
    expect(parseMoneyInput('0')).toBeNull()
    expect(parseMoneyInput('')).toBeNull()
    expect(parseMoneyInput('-5')).toBeNull()
    expect(parseMoneyInput('12.345')).toBeNull()
    expect(parseMoneyInput('abc')).toBeNull()
    expect(parseMoneyInput('.')).toBeNull()
  })

  it('treats an empty opening balance as zero', () => {
    expect(parseMoneyOrZero('')).toBe(0)
    expect(parseMoneyOrZero('12.00')).toBe(1200)
    expect(parseMoneyOrZero('nope')).toBeNull()
  })
})

describe('formatting', () => {
  it('uses the selected currency and tabular grouping', () => {
    expect(formatMoney(124050, 'GHS')).toBe('GH₵1,240.50')
    expect(formatMoney(500, 'NGN')).toBe('₦5.00')
    expect(formatMoney(500, 'KES')).toBe('KSh 5.00')
  })

  it('handles negative and signed values', () => {
    expect(formatMoney(-500, 'GHS')).toBe('−GH₵5.00')
    expect(formatMoney(500, 'GHS', { signed: true })).toBe('+GH₵5.00')
    expect(formatMoney(-500, 'GHS', { signed: true })).toBe('−GH₵5.00')
  })

  it('formats an input value from minor units', () => {
    expect(inputFromMinor(24050)).toBe('240.50')
    expect(inputFromMinor(5)).toBe('0.05')
  })
})
