import { describe, expect, it } from 'vitest'
import type { Database } from '../types'
import {
  balanceFor,
  calculateTotals,
  dailyCollections,
  recentEntries,
  runningEntries,
  sortSummaries,
  summariseCustomers,
  topDebtors,
} from './ledger'

const db: Database = {
  version: 1,
  settings: {
    shopName: 'Test Shop',
    ownerName: 'Ama',
    currency: 'GHS',
    isDemo: false,
  },
  customers: [
    {
      id: 'a',
      name: 'Ama Mensah',
      phone: '0245550192',
      note: '',
      createdAt: '2026-10-01T09:00:00.000Z',
    },
    {
      id: 'b',
      name: 'Kofi Boateng',
      phone: '',
      note: '',
      createdAt: '2026-10-02T09:00:00.000Z',
    },
  ],
  entries: [
    {
      id: '1',
      customerId: 'a',
      kind: 'credit',
      amountMinor: 10000,
      note: 'Rice',
      date: '2026-10-20',
      createdAt: '2026-10-20T10:00:00.000Z',
    },
    {
      id: '2',
      customerId: 'b',
      kind: 'credit',
      amountMinor: 5000,
      note: 'Oil',
      date: '2026-10-22',
      createdAt: '2026-10-22T10:00:00.000Z',
    },
    {
      id: '3',
      customerId: 'a',
      kind: 'payment',
      amountMinor: 4000,
      note: 'Cash',
      date: '2026-10-24',
      method: 'cash',
      createdAt: '2026-10-24T10:00:00.000Z',
    },
    {
      id: '4',
      customerId: 'b',
      kind: 'payment',
      amountMinor: 5000,
      note: 'MoMo',
      date: '2026-10-25',
      method: 'momo',
      createdAt: '2026-10-25T10:00:00.000Z',
    },
    {
      id: '5',
      customerId: 'a',
      kind: 'credit',
      amountMinor: 2000,
      note: 'Eggs',
      date: '2026-10-26',
      createdAt: '2026-10-26T10:00:00.000Z',
    },
  ],
}

describe('ledger maths', () => {
  it('calculates a running balance per customer', () => {
    expect(balanceFor(db, 'a')).toBe(8000)
    expect(balanceFor(db, 'b')).toBe(0)
    expect(balanceFor(db, 'missing')).toBe(0)
  })

  it('summarises customers with last activity and entry counts', () => {
    const summaries = summariseCustomers(db)
    const ama = summaries.find((item) => item.customer.id === 'a')
    expect(ama).toMatchObject({
      balance: 8000,
      lastActivity: '2026-10-26',
      entryCount: 3,
    })
  })

  it('totals outstanding, credit and collections', () => {
    const totals = calculateTotals(db, '2026-10-26')
    expect(totals.outstanding).toBe(8000)
    expect(totals.inCredit).toBe(0)
    expect(totals.collectedToday).toBe(0)
    expect(totals.collectedWeek).toBe(9000)
    expect(totals.customerCount).toBe(2)
    expect(totals.owingCount).toBe(1)
    expect(totals.settledCount).toBe(1)
  })

  it('groups payments by day', () => {
    const days = dailyCollections(db.entries, [
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ])
    expect(days).toEqual([
      { date: '2026-10-24', amount: 4000 },
      { date: '2026-10-25', amount: 5000 },
      { date: '2026-10-26', amount: 0 },
    ])
  })

  it('builds running entries in chronological order', () => {
    const entries = db.entries.filter((entry) => entry.customerId === 'a')
    const running = runningEntries(entries)
    expect(running.map((item) => item.balance)).toEqual([10000, 6000, 8000])
  })

  it('returns the newest activity first', () => {
    const recent = recentEntries(db, 2)
    expect(recent.map((item) => item.entry.id)).toEqual(['5', '4'])
    expect(recent[0].customer?.name).toBe('Ama Mensah')
  })

  it('sorts summaries and picks the largest debtors', () => {
    const summaries = summariseCustomers(db)
    expect(topDebtors(summaries).map((item) => item.customer.id)).toEqual(['a'])
    expect(sortSummaries(summaries, 'name')[0].customer.name).toBe('Ama Mensah')
    expect(sortSummaries(summaries, 'balance')[0].balance).toBe(8000)
  })
})
