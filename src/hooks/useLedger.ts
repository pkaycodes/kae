import { useCallback, useEffect, useReducer, useState } from 'react'
import type {
  Customer,
  Database,
  Entry,
  NewCustomerInput,
  NewEntryInput,
  Settings,
} from '../types'
import { createSampleDb } from '../data/sample'
import { todayISO } from '../lib/date'
import { newId } from '../lib/id'
import { emptyDb, loadDb, saveDb } from '../lib/storage'

type Action =
  | {
      type: 'setup'
      shopName: string
      ownerName: string
      currency: Settings['currency']
    }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'addCustomer'; customer: Customer; openingEntry: Entry | null }
  | { type: 'updateCustomer'; id: string; patch: Pick<Customer, 'name' | 'phone' | 'note'> }
  | { type: 'deleteCustomer'; id: string }
  | { type: 'addEntry'; entry: Entry }
  | { type: 'deleteEntry'; id: string }
  | { type: 'replace'; db: Database }
  | { type: 'reset' }

function reducer(state: Database, action: Action): Database {
  switch (action.type) {
    case 'setup':
      return {
        ...state,
        settings: {
          ...state.settings,
          shopName: action.shopName.trim(),
          ownerName: action.ownerName.trim(),
          currency: action.currency,
          isDemo: false,
        },
      }
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'addCustomer':
      return {
        ...state,
        customers: [action.customer, ...state.customers],
        entries: action.openingEntry
          ? [...state.entries, action.openingEntry]
          : state.entries,
      }
    case 'updateCustomer':
      return {
        ...state,
        customers: state.customers.map((customer) =>
          customer.id === action.id ? { ...customer, ...action.patch } : customer,
        ),
      }
    case 'deleteCustomer':
      return {
        ...state,
        customers: state.customers.filter((customer) => customer.id !== action.id),
        entries: state.entries.filter((entry) => entry.customerId !== action.id),
      }
    case 'addEntry':
      return { ...state, entries: [...state.entries, action.entry] }
    case 'deleteEntry':
      return {
        ...state,
        entries: state.entries.filter((entry) => entry.id !== action.id),
      }
    case 'replace':
      return action.db
    case 'reset':
      return {
        ...emptyDb(),
        settings: {
          ...state.settings,
          isDemo: false,
        },
      }
    default:
      return state
  }
}

export function useLedger() {
  const [db, dispatch] = useReducer(reducer, undefined, () => {
    const stored = loadDb()
    if (stored?.settings.shopName) return stored
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === '1') return createSampleDb()
    return stored ?? emptyDb()
  })
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    try {
      saveDb(db)
    } catch {
      // A failed write is an external-system error; surface it in Settings.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStorageError(true)
    }
  }, [db])

  const setup = useCallback(
    (shopName: string, ownerName: string, currency: Settings['currency']) => {
      dispatch({ type: 'setup', shopName, ownerName, currency })
    },
    [],
  )

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    dispatch({ type: 'settings', patch })
  }, [])

  const addCustomer = useCallback((input: NewCustomerInput): string => {
    const id = newId('cus')
    const now = new Date().toISOString()
    const customer: Customer = {
      id,
      name: input.name.trim(),
      phone: input.phone.trim(),
      note: input.note.trim(),
      createdAt: now,
    }
    const openingEntry: Entry | null =
      input.openingMinor && input.openingMinor > 0
        ? {
            id: newId('ent'),
            customerId: id,
            kind: 'credit',
            amountMinor: input.openingMinor,
            note: 'Opening balance',
            date: todayISO(),
            createdAt: now,
          }
        : null
    dispatch({ type: 'addCustomer', customer, openingEntry })
    return id
  }, [])

  const updateCustomer = useCallback(
    (id: string, patch: Pick<Customer, 'name' | 'phone' | 'note'>) => {
      dispatch({ type: 'updateCustomer', id, patch })
    },
    [],
  )

  const removeCustomer = useCallback((id: string) => {
    dispatch({ type: 'deleteCustomer', id })
  }, [])

  const addEntry = useCallback((input: NewEntryInput): string => {
    const id = newId('ent')
    const entry: Entry = {
      ...input,
      id,
      note: input.note.trim(),
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'addEntry', entry })
    return id
  }, [])

  const removeEntry = useCallback((id: string) => {
    dispatch({ type: 'deleteEntry', id })
  }, [])

  const loadSample = useCallback((sample: Database) => {
    dispatch({ type: 'replace', db: sample })
  }, [])

  const importDatabase = useCallback((next: Database) => {
    dispatch({ type: 'replace', db: next })
  }, [])

  const resetLedger = useCallback(() => {
    dispatch({ type: 'reset' })
  }, [])

  return {
    db,
    storageError,
    actions: {
      setup,
      updateSettings,
      addCustomer,
      updateCustomer,
      removeCustomer,
      addEntry,
      removeEntry,
      loadSample,
      importDatabase,
      resetLedger,
    },
  }
}
