export type Currency = 'GHS' | 'NGN' | 'KES' | 'USD' | 'GBP'

export type EntryKind = 'credit' | 'payment'

export type PaymentMethod = 'cash' | 'momo' | 'bank' | 'other'

export interface Customer {
  id: string
  name: string
  phone: string
  note: string
  createdAt: string
}

export interface Entry {
  id: string
  customerId: string
  kind: EntryKind
  /** Always a positive amount, in the minor unit of the shop currency. */
  amountMinor: number
  note: string
  /** Local calendar date, YYYY-MM-DD. */
  date: string
  method?: PaymentMethod
  createdAt: string
}

export interface Settings {
  shopName: string
  ownerName: string
  currency: Currency
  isDemo: boolean
}

export interface Database {
  version: 1
  customers: Customer[]
  entries: Entry[]
  settings: Settings
}

export interface CustomerSummary {
  customer: Customer
  balance: number
  lastActivity: string | null
  entryCount: number
}

export interface NewCustomerInput {
  name: string
  phone: string
  note: string
  openingMinor?: number
}

export interface NewEntryInput {
  customerId: string
  kind: EntryKind
  amountMinor: number
  note: string
  date: string
  method?: PaymentMethod
}
