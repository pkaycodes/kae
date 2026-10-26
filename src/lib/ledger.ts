import type {
  Customer,
  CustomerSummary,
  Database,
  Entry,
  PaymentMethod,
} from '../types'
import { addDaysISO, todayISO } from './date'

export function compareEntries(a: Entry, b: Entry): number {
  return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
}

export function entriesForCustomer(db: Database, customerId: string): Entry[] {
  return db.entries
    .filter((entry) => entry.customerId === customerId)
    .sort(compareEntries)
}

export function balanceFor(db: Database, customerId: string): number {
  return db.entries.reduce((total, entry) => {
    if (entry.customerId !== customerId) return total
    return total + (entry.kind === 'credit' ? entry.amountMinor : -entry.amountMinor)
  }, 0)
}

export function summariseCustomers(db: Database): CustomerSummary[] {
  const balances = new Map<string, number>()
  const counts = new Map<string, number>()
  const lastDates = new Map<string, string>()

  for (const entry of db.entries) {
    const credit = entry.kind === 'credit' ? entry.amountMinor : -entry.amountMinor
    balances.set(entry.customerId, (balances.get(entry.customerId) ?? 0) + credit)
    counts.set(entry.customerId, (counts.get(entry.customerId) ?? 0) + 1)
    const previous = lastDates.get(entry.customerId)
    if (!previous || entry.date > previous) lastDates.set(entry.customerId, entry.date)
  }

  return db.customers.map((customer) => ({
    customer,
    balance: balances.get(customer.id) ?? 0,
    entryCount: counts.get(customer.id) ?? 0,
    lastActivity:
      lastDates.get(customer.id) ??
      (customer.createdAt ? customer.createdAt.slice(0, 10) : null),
  }))
}

export function summariseOne(db: Database, customerId: string): CustomerSummary | null {
  return summariseCustomers(db).find((item) => item.customer.id === customerId) ?? null
}

export interface Totals {
  outstanding: number
  inCredit: number
  collectedToday: number
  collectedWeek: number
  customerCount: number
  owingCount: number
  settledCount: number
}

export function calculateTotals(db: Database, today = todayISO()): Totals {
  const summaries = summariseCustomers(db)
  const weekStart = addDaysISO(today, -6)
  let collectedToday = 0
  let collectedWeek = 0

  for (const entry of db.entries) {
    if (entry.kind !== 'payment') continue
    if (entry.date === today) collectedToday += entry.amountMinor
    if (entry.date >= weekStart && entry.date <= today) {
      collectedWeek += entry.amountMinor
    }
  }

  let outstanding = 0
  let inCredit = 0
  for (const item of summaries) {
    if (item.balance > 0) outstanding += item.balance
    if (item.balance < 0) inCredit += Math.abs(item.balance)
  }

  return {
    outstanding,
    inCredit,
    collectedToday,
    collectedWeek,
    customerCount: db.customers.length,
    owingCount: summaries.filter((item) => item.balance > 0).length,
    settledCount: summaries.filter((item) => item.balance === 0).length,
  }
}

export function dailyCollections(
  entries: Entry[],
  dates: string[],
): { date: string; amount: number }[] {
  const totals = new Map(dates.map((date) => [date, 0]))
  for (const entry of entries) {
    if (entry.kind !== 'payment') continue
    if (totals.has(entry.date)) {
      totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.amountMinor)
    }
  }
  return dates.map((date) => ({ date, amount: totals.get(date) ?? 0 }))
}

export function recentEntries(
  db: Database,
  limit = 6,
): { entry: Entry; customer: Customer | undefined }[] {
  const customers = new Map(db.customers.map((customer) => [customer.id, customer]))
  return [...db.entries]
    .sort((a, b) => compareEntries(b, a))
    .slice(0, limit)
    .map((entry) => ({ entry, customer: customers.get(entry.customerId) }))
}

export interface RunningEntry {
  entry: Entry
  balance: number
}

export function runningEntries(entries: Entry[]): RunningEntry[] {
  let balance = 0
  return [...entries].sort(compareEntries).map((entry) => {
    balance += entry.kind === 'credit' ? entry.amountMinor : -entry.amountMinor
    return { entry, balance }
  })
}

export function topDebtors(summaries: CustomerSummary[], limit = 4): CustomerSummary[] {
  return summaries
    .filter((item) => item.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit)
}

export function methodLabel(method?: PaymentMethod): string {
  switch (method) {
    case 'cash':
      return 'Cash'
    case 'momo':
      return 'Mobile money'
    case 'bank':
      return 'Bank'
    case 'other':
      return 'Other'
    default:
      return ''
  }
}

export function kindLabel(kind: Entry['kind']): string {
  return kind === 'credit' ? 'Credit given' : 'Payment received'
}

export function sortSummaries(
  summaries: CustomerSummary[],
  sort: 'balance' | 'name' | 'recent',
): CustomerSummary[] {
  const copy = [...summaries]
  if (sort === 'name') {
    return copy.sort((a, b) => a.customer.name.localeCompare(b.customer.name))
  }
  if (sort === 'recent') {
    return copy.sort((a, b) =>
      (b.lastActivity ?? '').localeCompare(a.lastActivity ?? ''),
    )
  }
  return copy.sort((a, b) => b.balance - a.balance || a.customer.name.localeCompare(b.customer.name))
}
