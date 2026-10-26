import { useEffect, useState } from 'react'
import type { Currency, EntryKind, NewCustomerInput, NewEntryInput } from './types'
import { createSampleDb } from './data/sample'
import { useLedger } from './hooks/useLedger'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import { balanceFor } from './lib/ledger'
import { CustomerDetail } from './components/CustomerDetail'
import { CustomerForm } from './components/CustomerForm'
import { Customers } from './components/Customers'
import { Dashboard } from './components/Dashboard'
import { EntryForm } from './components/EntryForm'
import { Icon } from './components/Icon'
import { Onboarding } from './components/Onboarding'
import { Settings } from './components/Settings'
import { Toast } from './components/Toast'
import { ConfirmDialog } from './components/ConfirmDialog'

type View = 'dashboard' | 'customers' | 'settings'

type CustomerFormState =
  | { mode: 'new' }
  | { mode: 'edit'; id: string }

type EntryFormState = {
  customerId: string
  kind: EntryKind
}

type ConfirmState = 'deleteCustomer' | 'reset' | 'clearDemo' | null

interface ToastState {
  id: number
  message: string
}

const NAV: { view: View; label: string; icon: 'home' | 'users' | 'settings' }[] = [
  { view: 'dashboard', label: 'Home', icon: 'home' },
  { view: 'customers', label: 'Customers', icon: 'users' },
  { view: 'settings', label: 'Settings', icon: 'settings' },
]

export default function App() {
  const { db, storageError, actions } = useLedger()
  const online = useOnlineStatus()
  const { available: installAvailable, install } = useInstallPrompt()

  const [view, setView] = useState<View>('dashboard')
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customerForm, setCustomerForm] = useState<CustomerFormState | null>(null)
  const [entryForm, setEntryForm] = useState<EntryFormState | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  function notify(message: string) {
    setToast({ id: Date.now(), message })
  }

  function startShop(shopName: string, ownerName: string, currency: Currency) {
    actions.setup(shopName, ownerName, currency)
    setView('dashboard')
    notify('Your ledger is open. Add your first customer.')
  }

  function startSample() {
    actions.loadSample(createSampleDb())
    setView('dashboard')
    notify('Sample shop loaded. Explore freely.')
  }

  function openNewCustomer() {
    setCustomerForm({ mode: 'new' })
  }

  function handleCustomerSubmit(input: NewCustomerInput) {
    if (!customerForm) return
    if (customerForm.mode === 'new') {
      const id = actions.addCustomer(input)
      setCustomerForm(null)
      setCustomerId(id)
      notify('Customer added. Record the first credit when you are ready.')
      return
    }
    actions.updateCustomer(customerForm.id, {
      name: input.name,
      phone: input.phone,
      note: input.note,
    })
    setCustomerForm(null)
    notify('Customer updated.')
  }

  function handleEntrySubmit(input: NewEntryInput) {
    actions.addEntry(input)
    setEntryForm(null)
    notify(input.kind === 'payment' ? 'Payment recorded.' : 'Credit recorded.')
  }

  const selectedCustomer =
    customerId !== null
      ? db.customers.find((customer) => customer.id === customerId)
      : undefined

  const editingCustomer =
    customerForm?.mode === 'edit'
      ? db.customers.find((customer) => customer.id === customerForm.id)
      : undefined

  const entryCustomer = entryForm
    ? db.customers.find((customer) => customer.id === entryForm.customerId)
    : undefined

  const confirmCopy =
    confirm === 'deleteCustomer' && selectedCustomer
      ? {
          title: `Delete ${selectedCustomer.name}?`,
          body: `This also removes their ${
            db.entries.filter((entry) => entry.customerId === selectedCustomer.id).length
          } ledger entries. This cannot be undone.`,
          label: 'Delete customer',
        }
      : confirm === 'reset'
        ? {
            title: 'Clear the whole ledger?',
            body: 'Every customer and entry will be removed from this device. Your shop details stay. Export a backup first if you need one.',
            label: 'Clear ledger',
          }
        : confirm === 'clearDemo'
          ? {
              title: 'Clear the sample shop?',
              body: 'The sample customers and entries will be removed. Your shop details stay, and you can start your real ledger.',
              label: 'Clear sample data',
            }
          : null

  function handleConfirm() {
    if (confirm === 'deleteCustomer' && selectedCustomer) {
      actions.removeCustomer(selectedCustomer.id)
      setCustomerId(null)
      notify('Customer deleted.')
      return
    }
    if (confirm === 'reset') {
      actions.resetLedger()
      setView('dashboard')
      notify('Ledger cleared. Shop details kept.')
      return
    }
    if (confirm === 'clearDemo') {
      actions.resetLedger()
      setView('dashboard')
      notify('Sample data cleared. Your ledger is ready.')
    }
  }

  if (!db.settings.shopName) {
    return (
      <>
        <Onboarding onStart={startShop} onSample={startSample} />
        {toast ? <Toast message={toast.message} onDismiss={() => setToast(null)} /> : null}
      </>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <button
            type="button"
            className="brand"
            onClick={() => setView('dashboard')}
            aria-label="Kae home"
          >
            Kae<span className="brand__dot">.</span>
          </button>

          <span className="topbar__shop">{db.settings.shopName}</span>

          <nav className="topbar__nav" aria-label="Main">
            {NAV.map((item) => (
              <button
                type="button"
                key={item.view}
                className={view === item.view ? 'is-active' : ''}
                onClick={() => setView(item.view)}
                aria-current={view === item.view ? 'page' : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="topbar__status">
            {!online ? (
              <span className="offline-pill">
                <Icon name="wifi-off" size={14} />
                Offline
              </span>
            ) : null}
            <button
              type="button"
              className="topbar__add"
              onClick={openNewCustomer}
            >
              <Icon name="plus" size={17} />
              <span>Add customer</span>
            </button>
          </div>
        </div>
      </header>

      <main className="shell">
        {view === 'dashboard' ? (
          <Dashboard
            db={db}
            onAddCustomer={openNewCustomer}
            onOpenCustomer={setCustomerId}
            onQuickPayment={(id) => setEntryForm({ customerId: id, kind: 'payment' })}
            onOpenCustomers={() => setView('customers')}
            onClearDemo={() => setConfirm('clearDemo')}
            onLoadSample={startSample}
          />
        ) : null}

        {view === 'customers' ? (
          <Customers
            db={db}
            onAddCustomer={openNewCustomer}
            onOpenCustomer={setCustomerId}
          />
        ) : null}

        {view === 'settings' ? (
          <Settings
            db={db}
            online={online}
            storageError={storageError}
            installAvailable={installAvailable}
            onUpdateSettings={actions.updateSettings}
            onImport={actions.importDatabase}
            onRequestReset={() => setConfirm('reset')}
            onRequestClearDemo={() => setConfirm('clearDemo')}
            onInstall={install}
            notify={notify}
          />
        ) : null}
      </main>

      <nav className="bottom-nav" aria-label="Main">
        <button
          type="button"
          className={view === 'dashboard' ? 'is-active' : ''}
          onClick={() => setView('dashboard')}
          aria-current={view === 'dashboard' ? 'page' : undefined}
        >
          <Icon name="home" size={20} />
          <span>Home</span>
        </button>
        <button
          type="button"
          className={view === 'customers' ? 'is-active' : ''}
          onClick={() => setView('customers')}
          aria-current={view === 'customers' ? 'page' : undefined}
        >
          <Icon name="users" size={20} />
          <span>Customers</span>
        </button>
        <button
          type="button"
          className="bottom-nav__add"
          onClick={openNewCustomer}
          aria-label="Add customer"
        >
          <span className="bottom-nav__add-circle">
            <Icon name="plus" size={21} />
          </span>
          <span>Add</span>
        </button>
        <button
          type="button"
          className={view === 'settings' ? 'is-active' : ''}
          onClick={() => setView('settings')}
          aria-current={view === 'settings' ? 'page' : undefined}
        >
          <Icon name="settings" size={20} />
          <span>Settings</span>
        </button>
      </nav>

      {selectedCustomer ? (
        <CustomerDetail
          open
          db={db}
          customerId={selectedCustomer.id}
          onClose={() => setCustomerId(null)}
          onAddEntry={(kind) =>
            setEntryForm({ customerId: selectedCustomer.id, kind })
          }
          onEdit={() => setCustomerForm({ mode: 'edit', id: selectedCustomer.id })}
          onDeleteCustomer={() => setConfirm('deleteCustomer')}
          onDeleteEntry={actions.removeEntry}
          notify={notify}
        />
      ) : null}

      {entryForm && entryCustomer ? (
        <EntryForm
          open
          customer={entryCustomer}
          currentBalance={balanceFor(db, entryCustomer.id)}
          currency={db.settings.currency}
          initialKind={entryForm.kind}
          onClose={() => setEntryForm(null)}
          onSubmit={handleEntrySubmit}
        />
      ) : null}

      {customerForm && (customerForm.mode === 'new' || editingCustomer) ? (
        <CustomerForm
          open
          mode={customerForm.mode}
          customer={editingCustomer}
          currency={db.settings.currency}
          onClose={() => setCustomerForm(null)}
          onSubmit={handleCustomerSubmit}
        />
      ) : null}

      <ConfirmDialog
        open={confirmCopy !== null}
        title={confirmCopy?.title ?? ''}
        body={confirmCopy?.body ?? ''}
        confirmLabel={confirmCopy?.label ?? 'Confirm'}
        tone="danger"
        onConfirm={handleConfirm}
        onClose={() => setConfirm(null)}
      />

      {toast ? <Toast message={toast.message} onDismiss={() => setToast(null)} /> : null}
    </div>
  )
}
