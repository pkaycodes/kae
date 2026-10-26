import { describe, expect, it } from 'vitest'
import { createSampleDb } from '../data/sample'
import { customerStatementCsv, customersCsv, entriesCsv, toCsv } from './csv'

describe('csv', () => {
  it('quotes commas, quotes and newlines, and starts with a BOM', () => {
    const csv = toCsv([
      ['Name', 'Note'],
      ['Kofi', 'Hello, "friend"'],
      ['Ama', 'Line one\nLine two'],
    ])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"Hello, ""friend"""')
    expect(csv).toContain('"Line one\nLine two"')
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('protects text cells that spreadsheet apps would treat as formulas', () => {
    const csv = toCsv([['Note'], ['=SUM(A1:A4)']])
    expect(csv).toContain("'=SUM(A1:A4)")
  })

  it('exports customers with numeric balances', () => {
    const csv = customersCsv(createSampleDb())
    expect(csv).toContain('Name,Phone,Balance,Last activity,Note')
    expect(csv).toContain('Ama Mensah,024 555 0192,240,')
  })

  it('exports entries and a single customer statement', () => {
    const db = createSampleDb()
    const entries = entriesCsv(db)
    expect(entries).toContain('Date,Customer,Type,Amount,Method,Note')
    expect(entries).toContain('Payment')
    expect(entries).toContain('Mobile money')

    const statement = customerStatementCsv(db, 'cus_ama')
    expect(statement).toContain('Statement — Ama Mensah')
    expect(statement).toContain('Running balance')
    expect(statement).toContain('300')
  })
})
