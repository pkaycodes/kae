import type {
  Currency,
  Customer,
  Database,
  Entry,
  PaymentMethod,
  Settings,
} from '../types'
import { isIsoDate, todayISO } from './date'
import { slugify } from './text'

export const STORAGE_KEY = 'kae.db.v1'
export const APP_ID = 'kae'
export const SCHEMA_VERSION = 1 as const

const CURRENCIES: Currency[] = ['GHS', 'NGN', 'KES', 'USD', 'GBP']
const METHODS: PaymentMethod[] = ['cash', 'momo', 'bank', 'other']

export function emptyDb(): Database {
  return {
    version: SCHEMA_VERSION,
    customers: [],
    entries: [],
    settings: {
      shopName: '',
      ownerName: '',
      currency: 'GHS',
      isDemo: false,
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function normaliseSettings(value: unknown): Settings {
  if (!isRecord(value)) throw new Error('The backup has no shop settings.')
  const shopName = asString(value.shopName).trim()
  if (!shopName) throw new Error('The backup has no shop name.')
  return {
    shopName,
    ownerName: asString(value.ownerName).trim(),
    currency: CURRENCIES.includes(value.currency as Currency)
      ? (value.currency as Currency)
      : 'GHS',
    isDemo: value.isDemo === true,
  }
}

function normaliseCustomer(value: unknown): Customer {
  if (!isRecord(value)) throw new Error('A customer entry is malformed.')
  const name = asString(value.name).trim()
  const id = asString(value.id)
  if (!id || !name) throw new Error('A customer is missing a name or id.')
  const createdAt = asString(value.createdAt)
  return {
    id,
    name,
    phone: asString(value.phone).trim(),
    note: asString(value.note).trim(),
    createdAt:
      createdAt && !Number.isNaN(Date.parse(createdAt))
        ? createdAt
        : new Date().toISOString(),
  }
}

function normaliseEntry(value: unknown, customerIds: Set<string>): Entry {
  if (!isRecord(value)) throw new Error('An entry in the backup is malformed.')
  const id = asString(value.id)
  const customerId = asString(value.customerId)
  const kind = value.kind
  const amountMinor = value.amountMinor
  const date = value.date

  if (!id) throw new Error('An entry is missing its id.')
  if (!customerIds.has(customerId)) {
    throw new Error('The backup has an entry for a customer that does not exist.')
  }
  if (kind !== 'credit' && kind !== 'payment') {
    throw new Error('An entry has an unknown type.')
  }
  if (
    typeof amountMinor !== 'number' ||
    !Number.isSafeInteger(amountMinor) ||
    amountMinor <= 0
  ) {
    throw new Error('An entry has an invalid amount.')
  }
  if (!isIsoDate(date)) throw new Error('An entry has an invalid date.')

  const method = METHODS.includes(value.method as PaymentMethod)
    ? (value.method as PaymentMethod)
    : undefined
  const createdAt = asString(value.createdAt)

  return {
    id,
    customerId,
    kind,
    amountMinor,
    note: asString(value.note).trim(),
    date,
    method: kind === 'payment' ? method : undefined,
    createdAt:
      createdAt && !Number.isNaN(Date.parse(createdAt))
        ? createdAt
        : `${date}T12:00:00.000Z`,
  }
}

export function normaliseDatabase(raw: unknown): Database {
  if (!isRecord(raw)) throw new Error('That file is not a Kae backup.')
  if (raw.app !== undefined && raw.app !== APP_ID) {
    throw new Error('That file was not exported by Kae.')
  }

  const payload = isRecord(raw.data) ? raw.data : raw
  if (payload.version !== SCHEMA_VERSION) {
    throw new Error('That backup was made with an unsupported version of Kae.')
  }
  if (!Array.isArray(payload.customers) || !Array.isArray(payload.entries)) {
    throw new Error('The backup is missing customers or entries.')
  }

  const customers = payload.customers.map(normaliseCustomer)
  const ids = new Set<string>()
  for (const customer of customers) {
    if (ids.has(customer.id)) throw new Error('The backup has duplicate customer ids.')
    ids.add(customer.id)
  }

  const entryIds = new Set<string>()
  const entries = payload.entries.map((entry) => {
    const normalised = normaliseEntry(entry, ids)
    if (entryIds.has(normalised.id)) {
      throw new Error('The backup has duplicate entry ids.')
    }
    entryIds.add(normalised.id)
    return normalised
  })

  return {
    version: SCHEMA_VERSION,
    customers,
    entries,
    settings: normaliseSettings(payload.settings),
  }
}

export function loadDb(
  storage: Pick<Storage, 'getItem'> = localStorage,
): Database | null {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normaliseDatabase(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveDb(
  db: Database,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export function serializeBackup(db: Database): string {
  return JSON.stringify(
    {
      app: APP_ID,
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: db,
    },
    null,
    2,
  )
}

export function parseBackup(text: string): Database {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  return normaliseDatabase(parsed)
}

export function downloadFile(filename: string, contents: string, type: string): void {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function backupFilename(shopName: string): string {
  return `kae-${slugify(shopName)}-${todayISO()}.json`
}

export function storageSize(db: Database): number {
  try {
    return new Blob([JSON.stringify(db)]).size
  } catch {
    return 0
  }
}
