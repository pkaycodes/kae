import type { Database } from '../types'
import { addDaysISO, dayNumber, formatDate, greeting, longDate, todayISO, weekdayShort } from '../lib/date'
import {
  calculateTotals,
  dailyCollections,
  kindLabel,
  methodLabel,
  recentEntries,
  summariseCustomers,
  topDebtors,
} from '../lib/ledger'
import { formatMoney } from '../lib/money'
import { paymentReminder } from '../lib/messages'
import { whatsappLink } from '../lib/phone'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

interface DashboardProps {
  db: Database
  onAddCustomer: () => void
  onOpenCustomer: (id: string) => void
  onQuickPayment: (id: string) => void
  onOpenCustomers: () => void
  onClearDemo: () => void
  onLoadSample: () => void
}

export function Dashboard({
  db,
  onAddCustomer,
  onOpenCustomer,
  onQuickPayment,
  onOpenCustomers,
  onClearDemo,
  onLoadSample,
}: DashboardProps) {
  const totals = calculateTotals(db)
  const summaries = summariseCustomers(db)
  const debtors = topDebtors(summaries, 4)
  const recent = recentEntries(db, 6)
  const dates = Array.from({ length: 7 }, (_, index) =>
    addDaysISO(todayISO(), index - 6),
  )
  const chart = dailyCollections(db.entries, dates)
  const chartMax = Math.max(...chart.map((item) => item.amount), 1)
  const { currency, shopName, ownerName } = db.settings
  const today = todayISO()

  if (db.customers.length === 0) {
    return (
      <div className="page page--dashboard">
        <section className="empty-ledger">
          <div className="empty-ledger__mark" aria-hidden="true">
            Kae.
          </div>
          <span className="eyebrow">Your ledger is open</span>
          <h1>
            Who owes you <em>right now?</em>
          </h1>
          <p>
            Add your first customer and Kae will keep the running balance — no
            notebook, no mental arithmetic, no signal needed.
          </p>
          <div className="empty-ledger__actions">
            <button type="button" className="btn btn--accent" onClick={onAddCustomer}>
              <Icon name="plus" size={18} />
              Add your first customer
            </button>
            <button type="button" className="btn btn--quiet" onClick={onLoadSample}>
              Load sample data
            </button>
          </div>
          <ol className="empty-ledger__steps">
            <li>
              <span>01</span>
              Add a customer
            </li>
            <li>
              <span>02</span>
              Record what they took
            </li>
            <li>
              <span>03</span>
              Take a payment when they return
            </li>
          </ol>
        </section>
      </div>
    )
  }

  return (
    <div className="page page--dashboard">
      {db.settings.isDemo ? (
        <div className="demo-banner">
          <span>
            <Icon name="spark" size={16} />
            You are exploring a sample shop. Changes are saved on this device.
          </span>
          <button type="button" onClick={onClearDemo}>
            Clear sample data
          </button>
        </div>
      ) : null}

      <section className="hero">
        <div className="hero__main">
          <div className="hero__top">
            <span className="hero__greeting">
              {greeting()}
              {ownerName ? `, ${ownerName}` : ''}
            </span>
            <span className="hero__date">{longDate()}</span>
          </div>

          <p className="hero__label">Owed to you</p>
          <h1 className="hero__amount" data-testid="outstanding-total">
            {formatMoney(totals.outstanding, currency)}
          </h1>
          <p className="hero__sub">
            {totals.owingCount === 0
              ? 'Everyone is settled up. A good day.'
              : `across ${totals.owingCount} customer${totals.owingCount === 1 ? '' : 's'}`}
            {totals.inCredit > 0
              ? ` · ${formatMoney(totals.inCredit, currency)} in credit`
              : ''}
          </p>

          <div className="hero__actions">
            <button type="button" className="btn btn--accent" onClick={onAddCustomer}>
              <Icon name="plus" size={18} />
              Add customer
            </button>
            <button type="button" className="btn btn--ghost" onClick={onOpenCustomers}>
              <Icon name="users" size={18} />
              View customers
            </button>
          </div>

          <div className="hero__stats">
            <div>
              <span>Collected today</span>
              <strong>{formatMoney(totals.collectedToday, currency)}</strong>
            </div>
            <div>
              <span>Last 7 days</span>
              <strong>{formatMoney(totals.collectedWeek, currency)}</strong>
            </div>
            <div>
              <span>Customers</span>
              <strong>{totals.customerCount}</strong>
            </div>
          </div>
        </div>

        <div className="hero__side">
          <div
            className="chart"
            role="img"
            aria-label={`Payments received in the last seven days: ${chart
              .map((item) => `${weekdayShort(item.date)} ${formatMoney(item.amount, currency)}`)
              .join(', ')}`}
          >
            <div className="chart__head">
              <span>Payments</span>
              <strong>{formatMoney(totals.collectedWeek, currency)}</strong>
            </div>
            <div className="chart__bars" aria-hidden="true">
              {chart.map((item) => {
                const height = item.amount === 0 ? 3 : Math.max(8, Math.round((item.amount / chartMax) * 100))
                return (
                  <div
                    className={`chart__col ${item.date === today ? 'is-today' : ''}`}
                    key={item.date}
                    title={`${formatDate(item.date)}: ${formatMoney(item.amount, currency)}`}
                  >
                    <div className="chart__track">
                      <div className="chart__bar" style={{ height: `${height}%` }} />
                    </div>
                    <span className="chart__day">{weekdayShort(item.date).slice(0, 2)}</span>
                    <span className="chart__num">{dayNumber(item.date)}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <p className="hero__note">
            <Icon name="shield" size={14} />
            Saved on this device. Back up any time in Settings.
          </p>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="card">
          <div className="card__head">
            <div>
              <span className="eyebrow">Follow up</span>
              <h2>Who owes you</h2>
            </div>
            <button type="button" className="btn btn--quiet btn--sm" onClick={onOpenCustomers}>
              All customers
              <Icon name="chevron-right" size={15} />
            </button>
          </div>

          {debtors.length === 0 ? (
            <p className="card__empty">
              No outstanding balances. Everyone has paid up.
            </p>
          ) : (
            <ul className="debtors">
              {debtors.map((item) => {
                const reminder = whatsappLink(
                  item.customer.phone,
                  paymentReminder(shopName, item.customer.name, item.balance, currency),
                )
                return (
                  <li className="debtor" key={item.customer.id}>
                    <button
                      type="button"
                      className="debtor__main"
                      onClick={() => onOpenCustomer(item.customer.id)}
                    >
                      <Avatar name={item.customer.name} />
                      <span className="debtor__identity">
                        <strong>{item.customer.name}</strong>
                        <span>{item.customer.phone || 'No phone number'}</span>
                      </span>
                      <span className="debtor__amount">
                        <strong>{formatMoney(item.balance, currency)}</strong>
                        <span>{item.lastActivity ? formatDate(item.lastActivity) : 'New'}</span>
                      </span>
                    </button>
                    <div className="debtor__actions">
                      <button
                        type="button"
                        className="icon-btn icon-btn--pay"
                        onClick={() => onQuickPayment(item.customer.id)}
                        aria-label={`Record a payment from ${item.customer.name}`}
                        title="Record payment"
                      >
                        <Icon name="download" size={17} />
                      </button>
                      {reminder ? (
                        <a
                          className="icon-btn icon-btn--wa"
                          href={reminder}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Send a WhatsApp reminder to ${item.customer.name}`}
                          title="WhatsApp reminder"
                        >
                          <Icon name="message" size={17} />
                        </a>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card__head">
            <div>
              <span className="eyebrow">The day book</span>
              <h2>Recent activity</h2>
            </div>
          </div>

          {recent.length === 0 ? (
            <p className="card__empty">No entries yet. Record the first one.</p>
          ) : (
            <ul className="activity">
              {recent.map(({ entry, customer }) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className="activity__row"
                    onClick={() => customer && onOpenCustomer(customer.id)}
                  >
                    <span
                      className={`activity__mark activity__mark--${entry.kind}`}
                      aria-hidden="true"
                    >
                      <Icon
                        name={entry.kind === 'credit' ? 'upload' : 'download'}
                        size={15}
                      />
                    </span>
                    <span className="activity__body">
                      <strong>{customer?.name ?? 'Unknown customer'}</strong>
                      <span>
                        {kindLabel(entry.kind)}
                        {entry.method ? ` · ${methodLabel(entry.method)}` : ''} ·{' '}
                        {formatDate(entry.date)}
                      </span>
                    </span>
                    <span className={`activity__amount activity__amount--${entry.kind}`}>
                      {entry.kind === 'credit' ? '+' : '−'}
                      {formatMoney(entry.amountMinor, currency)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="ledger-note">
        <Icon name="receipt" size={18} />
        <p>
          <strong>One rule of thumb:</strong> record the credit before the
          customer leaves the shop. A few seconds now saves an argument later.
        </p>
      </section>
    </div>
  )
}
