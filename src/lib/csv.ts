import type { Database, Entry } from '../types'
import { todayISO } from './date'
import { methodLabel, runningEntries, summariseCustomers } from './ledger'
import { slugify } from './text'

type Cell = string | number

function csvCell(value: Cell): string {
  if (typeof value === 'number') return String(value)
  let text = value
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`
  return text
}

export function toCsv(rows: Cell[][]): string {
  const body = rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
  return `\uFEFF${body}\r\n`
}

function moneyNumber(minor: number): number {
  return Number((minor / 100).toFixed(2))
}

export function customersCsv(db: Database): string {
  const rows: Cell[][] = [
    ['Name', 'Phone', 'Balance', 'Last activity', 'Note'],
    ...summariseCustomers(db).map((item) => [
      item.customer.name,
      item.customer.phone,
      moneyNumber(item.balance),
      item.lastActivity ?? '',
      item.customer.note,
    ]),
  ]
  return toCsv(rows)
}

export function entriesCsv(db: Database): string {
  const names = new Map(db.customers.map((customer) => [customer.id, customer.name]))
  const rows: Cell[][] = [
    ['Date', 'Customer', 'Type', 'Amount', 'Method', 'Note'],
    ...[...db.entries]
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
      .map((entry) => [
        entry.date,
        names.get(entry.customerId) ?? 'Unknown',
        entry.kind === 'credit' ? 'Credit' : 'Payment',
        moneyNumber(entry.amountMinor),
        entry.kind === 'payment' ? methodLabel(entry.method) : '',
        entry.note,
      ]),
  ]
  return toCsv(rows)
}

export function customerStatementCsv(db: Database, customerId: string): string {
  const customer = db.customers.find((item) => item.id === customerId)
  if (!customer) throw new Error('Customer not found')
  const entries = db.entries.filter((entry) => entry.customerId === customerId)
  const rows: Cell[][] = [
    [`Statement — ${customer.name}`],
    ['Date', 'Type', 'Amount', 'Method', 'Note', 'Running balance'],
    ...runningEntries(entries).map(({ entry, balance }) => [
      entry.date,
      entry.kind === 'credit' ? 'Credit' : 'Payment',
      moneyNumber(entry.amountMinor),
      entry.kind === 'payment' ? methodLabel(entry.method) : '',
      entry.note,
      moneyNumber(balance),
    ]),
  ]
  return toCsv(rows)
}

export function csvFilename(shopName: string, suffix: string): string {
  return `${slugify(shopName)}-${suffix}-${todayISO()}.csv`
}

export function methodForCsv(entry: Entry): string {
  return entry.kind === 'payment' ? methodLabel(entry.method) : ''
}
