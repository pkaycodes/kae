import { useRef, useState, type FormEvent } from 'react'
import type { Currency, Database, Settings as SettingsModel } from '../types'
import { CURRENCIES } from '../lib/money'
import { customersCsv, csvFilename, entriesCsv } from '../lib/csv'
import {
  backupFilename,
  downloadFile,
  parseBackup,
  serializeBackup,
  storageSize,
} from '../lib/storage'
import { Icon } from './Icon'

interface SettingsProps {
  db: Database
  online: boolean
  storageError: boolean
  installAvailable: boolean
  onUpdateSettings: (patch: Partial<SettingsModel>) => void
  onImport: (db: Database) => void
  onRequestReset: () => void
  onRequestClearDemo: () => void
  onInstall: () => Promise<boolean>
  notify: (message: string) => void
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  return `${(value / 1024).toFixed(1)} KB`
}

export function Settings({
  db,
  online,
  storageError,
  installAvailable,
  onUpdateSettings,
  onImport,
  onRequestReset,
  onRequestClearDemo,
  onInstall,
  notify,
}: SettingsProps) {
  const [shopName, setShopName] = useState(db.settings.shopName)
  const [ownerName, setOwnerName] = useState(db.settings.ownerName)
  const [currency, setCurrency] = useState<Currency>(db.settings.currency)
  const [error, setError] = useState('')
  const [importError, setImportError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const dirty =
    shopName.trim() !== db.settings.shopName ||
    ownerName.trim() !== db.settings.ownerName ||
    currency !== db.settings.currency

  function saveDetails(event: FormEvent) {
    event.preventDefault()
    if (!shopName.trim()) {
      setError('Your shop needs a name.')
      return
    }
    onUpdateSettings({
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      currency,
    })
    setError('')
    notify('Shop details saved.')
  }

  function exportBackup() {
    downloadFile(
      backupFilename(db.settings.shopName),
      serializeBackup(db),
      'application/json',
    )
    notify('Backup downloaded. Keep it somewhere safe.')
  }

  function exportCustomers() {
    downloadFile(
      csvFilename(db.settings.shopName, 'customers'),
      customersCsv(db),
      'text/csv;charset=utf-8',
    )
    notify('Customer list downloaded.')
  }

  function exportEntries() {
    downloadFile(
      csvFilename(db.settings.shopName, 'entries'),
      entriesCsv(db),
      'text/csv;charset=utf-8',
    )
    notify('Entry history downloaded.')
  }

  async function importBackup(file: File) {
    setImportError('')
    try {
      const text = await file.text()
      const next = parseBackup(text)
      onImport(next)
      setShopName(next.settings.shopName)
      setOwnerName(next.settings.ownerName)
      setCurrency(next.settings.currency)
      notify('Backup restored.')
    } catch (reason) {
      setImportError(
        reason instanceof Error ? reason.message : 'That backup could not be read.',
      )
    }
  }

  async function install() {
    const accepted = await onInstall()
    if (accepted) notify('Kae is installed on this device.')
  }

  return (
    <div className="page page--settings">
      <header className="page-head">
        <div>
          <span className="eyebrow">Your shop</span>
          <h1>Settings</h1>
          <p className="muted">Everything is stored in this browser, not on a server.</p>
        </div>
      </header>

      {storageError ? (
        <div className="alert alert--danger" role="alert">
          <Icon name="alert" size={18} />
          <p>
            This browser could not save your latest changes. Export a backup now
            and free up some space.
          </p>
        </div>
      ) : null}

      {db.settings.isDemo ? (
        <div className="alert alert--demo">
          <Icon name="spark" size={18} />
          <p>
            <strong>You are using sample data.</strong> Explore freely, then clear
            it when you are ready to start your real ledger.
          </p>
          <button type="button" className="btn btn--quiet btn--sm" onClick={onRequestClearDemo}>
            Clear sample data
          </button>
        </div>
      ) : null}

      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card__head">
            <span className="settings-card__icon">
              <Icon name="wallet" size={19} />
            </span>
            <div>
              <h2>Shop details</h2>
              <p>Used on the dashboard, statements and reminders.</p>
            </div>
          </div>

          <form onSubmit={saveDetails}>
            <label className="field">
              <span className="field__label">Shop name</span>
              <input
                value={shopName}
                onChange={(event) => {
                  setShopName(event.target.value)
                  setError('')
                }}
                placeholder="e.g. Adom Provisions"
              />
            </label>

            <label className="field">
              <span className="field__label">Your name (optional)</span>
              <input
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                placeholder="e.g. Ama"
              />
            </label>

            <label className="field">
              <span className="field__label">Currency</span>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value as Currency)}
              >
                {CURRENCIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
              <span className="field__hint">
                Changes the symbol only. Existing amounts are not converted.
              </span>
            </label>

            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn btn--primary" disabled={!dirty}>
              Save details
            </button>
          </form>
        </section>

        <section className="settings-card">
          <div className="settings-card__head">
            <span className="settings-card__icon">
              <Icon name="database" size={19} />
            </span>
            <div>
              <h2>Backup and export</h2>
              <p>One file is enough to move to a new phone.</p>
            </div>
          </div>

          <button type="button" className="settings-action" onClick={exportBackup}>
            <span className="settings-action__icon">
              <Icon name="download" size={18} />
            </span>
            <span>
              <strong>Download a backup</strong>
              <small>JSON · includes customers and every entry</small>
            </span>
            <Icon name="chevron-right" size={17} />
          </button>

          <button
            type="button"
            className="settings-action"
            onClick={() => fileRef.current?.click()}
          >
            <span className="settings-action__icon">
              <Icon name="upload" size={18} />
            </span>
            <span>
              <strong>Restore from a backup</strong>
              <small>Replaces everything currently in this browser</small>
            </span>
            <Icon name="chevron-right" size={17} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void importBackup(file)
              event.target.value = ''
            }}
          />

          {importError ? (
            <p className="form-error" role="alert">
              {importError}
            </p>
          ) : null}

          <div className="settings-split">
            <button type="button" className="btn btn--quiet btn--sm" onClick={exportCustomers}>
              <Icon name="download" size={15} />
              Customers CSV
            </button>
            <button type="button" className="btn btn--quiet btn--sm" onClick={exportEntries}>
              <Icon name="download" size={15} />
              Entries CSV
            </button>
          </div>

          <p className="settings-meta">
            <Icon name="shield" size={14} />
            Using {formatBytes(storageSize(db))} on this device ·{' '}
            {online ? 'Online' : 'Offline — still working'}
          </p>
        </section>

        <section className="settings-card">
          <div className="settings-card__head">
            <span className="settings-card__icon">
              <Icon name="install" size={19} />
            </span>
            <div>
              <h2>Install Kae</h2>
              <p>Open it from your home screen, like any other app.</p>
            </div>
          </div>

          {installAvailable ? (
            <button type="button" className="btn btn--accent" onClick={() => void install()}>
              <Icon name="install" size={17} />
              Install on this device
            </button>
          ) : (
            <p className="settings-note">
              In Chrome or Safari, open the browser menu and choose{' '}
              <strong>Add to Home Screen</strong>. Kae works offline once installed.
            </p>
          )}

          <div className="offline-note">
            <Icon name="wifi-off" size={16} />
            <span>
              No signal? Keep recording. Kae queues nothing and sends nothing — the
              ledger is already on your phone.
            </span>
          </div>
        </section>

        <section className="settings-card settings-card--danger">
          <div className="settings-card__head">
            <span className="settings-card__icon">
              <Icon name="alert" size={19} />
            </span>
            <div>
              <h2>Clear the ledger</h2>
              <p>Deletes every customer and entry. Shop details stay.</p>
            </div>
          </div>

          <p className="settings-note">
            Download a backup first. There is no server copy to fall back on.
          </p>

          <button type="button" className="btn btn--danger-quiet" onClick={onRequestReset}>
            <Icon name="trash" size={16} />
            Clear all ledger data
          </button>
        </section>
      </div>

      <footer className="settings-footer">
        <div className="wordmark wordmark--small">
          Kae<span className="wordmark__dot">.</span>
        </div>
        <p>
          Version 1.0.0 · Built in Accra · Open source on{' '}
          <a href="https://github.com/pkaycodes/kae" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </p>
        <p>No accounts, no analytics, no server. Your ledger belongs to you.</p>
      </footer>
    </div>
  )
}
