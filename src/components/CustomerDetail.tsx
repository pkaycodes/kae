import { useState } from 'react'
import type { Database, Entry, EntryKind } from '../types'
import { customerStatementCsv, csvFilename } from '../lib/csv'
import { formatDate } from '../lib/date'
import { balanceFor, entriesForCustomer, kindLabel, methodLabel, runningEntries } from '../lib/ledger'
import { friendlyGreeting, paymentReminder } from '../lib/messages'
import { formatMoney } from '../lib/money'
import { displayPhone, phoneDigits, whatsappLink } from '../lib/phone'
import { downloadFile } from '../lib/storage'
import { slugify } from '../lib/text'
import { Avatar } from './Avatar'
import { ConfirmDialog } from './ConfirmDialog'
import { Icon } from './Icon'
import { Modal } from './Modal'

interface CustomerDetailProps {
  open: boolean
  db: Database
  customerId: string
  onClose: () => void
  onAddEntry: (kind: EntryKind) => void
  onEdit: () => void
  onDeleteCustomer: () => void
  onDeleteEntry: (id: string) => void
  notify: (message: string) => void
}

export function CustomerDetail({
  open,
  db,
  customerId,
  onClose,
  onAddEntry,
  onEdit,
  onDeleteCustomer,
  onDeleteEntry,
  notify,
}: CustomerDetailProps) {
  const [pendingEntry, setPendingEntry] = useState<Entry | null>(null)
  const customer = db.customers.find((item) => item.id === customerId)
  if (!customer) return null

  const customerName = customer.name
  const { currency, shopName } = db.settings
  const balance = balanceFor(db, customerId)
  const entries = entriesForCustomer(db, customerId)
  const rows = runningEntries(entries).reverse()
  const latestDate = rows[0]?.entry.date
  const phone = phoneDigits(customer.phone)
  const reminder = whatsappLink(
    customer.phone,
    balance > 0
      ? paymentReminder(shopName, customer.name, balance, currency)
      : friendlyGreeting(shopName, customer.name),
  )

  function downloadStatement() {
    const csv = customerStatementCsv(db, customerId)
    downloadFile(
      csvFilename(shopName, `statement-${slugify(customerName)}`),
      csv,
      'text/csv;charset=utf-8',
    )
    notify('Statement downloaded.')
  }

  const statusLabel =
    balance > 0 ? 'Outstanding balance' : balance < 0 ? 'In credit' : 'Balance'
  const statusAmount = balance < 0 ? Math.abs(balance) : balance

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        className="modal--drawer"
        labelledBy="customer-detail-title"
      >
        <div className="drawer">
          <header className="drawer__head">
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label="Back"
            >
              <Icon name="arrow-left" size={19} />
            </button>

            <div className="drawer__identity">
              <Avatar name={customer.name} size="lg" />
              <div>
                <h2 id="customer-detail-title">{customer.name}</h2>
                <span>
                  {customer.phone ? displayPhone(customer.phone) : 'No phone number'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="icon-btn"
              onClick={onEdit}
              aria-label={`Edit ${customer.name}`}
            >
              <Icon name="edit" size={18} />
            </button>
          </header>

          <div className="drawer__scroll">
            <section className="balance-card">
              <span className="eyebrow eyebrow--gold">{statusLabel}</span>
              <div className="balance-card__amount" data-testid="customer-balance">
                {formatMoney(statusAmount, currency)}
              </div>
              <p>
                {balance > 0
                  ? latestDate
                    ? `Last activity ${formatDate(latestDate)}.`
                    : 'No activity yet.'
                  : balance < 0
                    ? 'They have paid ahead. The next credit can use this balance.'
                    : entries.length === 0
                      ? 'No entries yet. Record the first credit or payment.'
                      : 'Settled in full. Nothing outstanding.'}
              </p>
              <div className="balance-card__actions">
                <button
                  type="button"
                  className="btn btn--accent"
                  onClick={() => onAddEntry('payment')}
                >
                  <Icon name="download" size={17} />
                  They paid
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => onAddEntry('credit')}
                >
                  <Icon name="upload" size={17} />
                  Gave credit
                </button>
              </div>
            </section>

            <div className="contact-row">
              {phone ? (
                <a className="btn btn--quiet btn--sm" href={`tel:${phone}`}>
                  <Icon name="phone" size={15} />
                  Call
                </a>
              ) : null}
              {reminder ? (
                <a
                  className="btn btn--quiet btn--sm"
                  href={reminder}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="message" size={15} />
                  {balance > 0 ? 'Send reminder' : 'WhatsApp'}
                </a>
              ) : null}
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                onClick={downloadStatement}
              >
                <Icon name="receipt" size={15} />
                Statement
              </button>
            </div>

            {customer.note ? (
              <div className="note-card">
                <span className="eyebrow">Note</span>
                <p>{customer.note}</p>
              </div>
            ) : null}

            <section className="ledger-section">
              <div className="ledger-section__head">
                <h3>Ledger</h3>
                <span>
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              {rows.length === 0 ? (
                <div className="ledger-empty">
                  <Icon name="receipt" size={22} />
                  <p>
                    Nothing recorded yet. Add the first credit or payment to
                    start the history.
                  </p>
                </div>
              ) : (
                <ul className="timeline">
                  {rows.map(({ entry, balance: running }) => (
                    <li className="timeline__item" key={entry.id}>
                      <span
                        className={`timeline__mark timeline__mark--${entry.kind}`}
                        aria-hidden="true"
                      >
                        <Icon
                          name={entry.kind === 'credit' ? 'upload' : 'download'}
                          size={15}
                        />
                      </span>

                      <div className="timeline__body">
                        <strong>{entry.note || kindLabel(entry.kind)}</strong>
                        <span>
                          {kindLabel(entry.kind)}
                          {entry.method ? ` · ${methodLabel(entry.method)}` : ''} ·{' '}
                          {formatDate(entry.date, { withYear: true })}
                        </span>
                      </div>

                      <div className="timeline__amounts">
                        <strong className={`is-${entry.kind}`}>
                          {entry.kind === 'credit' ? '+' : '−'}
                          {formatMoney(entry.amountMinor, currency)}
                        </strong>
                        <span>Bal. {formatMoney(running, currency)}</span>
                      </div>

                      <button
                        type="button"
                        className="timeline__delete"
                        onClick={() => setPendingEntry(entry)}
                        aria-label={`Delete entry: ${entry.note || kindLabel(entry.kind)}`}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <footer className="drawer__footer">
              <button
                type="button"
                className="btn btn--danger-quiet btn--sm"
                onClick={onDeleteCustomer}
              >
                <Icon name="trash" size={15} />
                Delete customer
              </button>
              <span>
                Added {formatDate(customer.createdAt.slice(0, 10), { withYear: true })}
              </span>
            </footer>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingEntry !== null}
        title="Delete this entry?"
        body="The entry will be removed and the customer's balance recalculated. This cannot be undone."
        confirmLabel="Delete entry"
        tone="danger"
        onClose={() => setPendingEntry(null)}
        onConfirm={() => {
          if (!pendingEntry) return
          onDeleteEntry(pendingEntry.id)
          notify('Entry removed.')
        }}
      />
    </>
  )
}
