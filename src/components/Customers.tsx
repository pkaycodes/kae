import { useMemo, useState } from 'react'
import type { Database } from '../types'
import { formatDate } from '../lib/date'
import { calculateTotals, sortSummaries, summariseCustomers } from '../lib/ledger'
import { formatMoney } from '../lib/money'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

type Filter = 'owing' | 'all' | 'settled'
type Sort = 'balance' | 'name' | 'recent'

interface CustomersProps {
  db: Database
  onAddCustomer: () => void
  onOpenCustomer: (id: string) => void
}

export function Customers({ db, onAddCustomer, onOpenCustomer }: CustomersProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('owing')
  const [sort, setSort] = useState<Sort>('balance')

  const summaries = useMemo(() => summariseCustomers(db), [db])
  const totals = calculateTotals(db)
  const owing = summaries.filter((item) => item.balance > 0).length
  const settled = summaries.filter((item) => item.balance === 0).length

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = summaries.filter((item) => {
      if (filter === 'owing' && item.balance <= 0) return false
      if (filter === 'settled' && item.balance !== 0) return false
      if (!needle) return true
      return (
        item.customer.name.toLowerCase().includes(needle) ||
        item.customer.phone.includes(needle) ||
        item.customer.note.toLowerCase().includes(needle)
      )
    })
    return sortSummaries(filtered, sort)
  }, [summaries, filter, sort, query])

  return (
    <div className="page page--customers">
      <header className="page-head">
        <div>
          <span className="eyebrow">Shop ledger</span>
          <h1>Customers</h1>
          <p className="muted">
            {summaries.length} customer{summaries.length === 1 ? '' : 's'}
            {totals.outstanding > 0
              ? ` · ${formatMoney(totals.outstanding, db.settings.currency)} outstanding`
              : ' · all settled'}
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={onAddCustomer}>
          <Icon name="plus" size={17} />
          Add customer
        </button>
      </header>

      <div className="toolbar">
        <label className="search">
          <Icon name="search" size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, phone or note"
            aria-label="Search customers"
          />
          {query ? (
            <button
              type="button"
              className="search__clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <Icon name="x" size={15} />
            </button>
          ) : null}
        </label>

        <div className="toolbar__right">
          <div className="filter-chips" role="group" aria-label="Filter customers">
            <button
              type="button"
              className={filter === 'owing' ? 'is-active' : ''}
              onClick={() => setFilter('owing')}
            >
              Owing <span>{owing}</span>
            </button>
            <button
              type="button"
              className={filter === 'settled' ? 'is-active' : ''}
              onClick={() => setFilter('settled')}
            >
              Settled <span>{settled}</span>
            </button>
            <button
              type="button"
              className={filter === 'all' ? 'is-active' : ''}
              onClick={() => setFilter('all')}
            >
              All <span>{summaries.length}</span>
            </button>
          </div>

          <label className="sort">
            <span className="sr-only">Sort customers</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
              <option value="balance">Highest owed</option>
              <option value="recent">Recent activity</option>
              <option value="name">Name A–Z</option>
            </select>
            <Icon name="chevron-down" size={15} />
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty-panel">
          <span className="empty-panel__icon">
            <Icon name="users" size={24} />
          </span>
          <h2>
            {summaries.length === 0
              ? 'No customers yet'
              : query
                ? 'No one matches that search'
                : filter === 'owing'
                  ? 'No one owes you'
                  : 'Nothing here'}
          </h2>
          <p>
            {summaries.length === 0
              ? 'Add your first customer to start a running balance.'
              : query
                ? 'Try a different name or phone number.'
                : 'Switch the filter to see everyone in your ledger.'}
          </p>
          {summaries.length === 0 ? (
            <button type="button" className="btn btn--primary" onClick={onAddCustomer}>
              <Icon name="plus" size={17} />
              Add customer
            </button>
          ) : query ? (
            <button type="button" className="btn btn--quiet" onClick={() => setQuery('')}>
              Clear search
            </button>
          ) : (
            <button type="button" className="btn btn--quiet" onClick={() => setFilter('all')}>
              Show all customers
            </button>
          )}
        </div>
      ) : (
        <div className="customer-list">
          <div className="customer-list__head" aria-hidden="true">
            <span>Customer</span>
            <span>Balance</span>
            <span>Last activity</span>
            <span />
          </div>
          <ul>
            {visible.map((item) => (
              <li key={item.customer.id}>
                <button
                  type="button"
                  className="customer-row"
                  onClick={() => onOpenCustomer(item.customer.id)}
                >
                  <Avatar name={item.customer.name} />
                  <span className="customer-row__identity">
                    <strong>{item.customer.name}</strong>
                    <span>
                      {item.customer.phone || item.customer.note || 'No phone number'}
                    </span>
                  </span>
                  <span
                    className={`customer-row__balance ${
                      item.balance > 0
                        ? 'is-owing'
                        : item.balance < 0
                          ? 'is-credit'
                          : 'is-settled'
                    }`}
                  >
                    <strong>{formatMoney(Math.abs(item.balance), db.settings.currency)}</strong>
                    <span>
                      {item.balance > 0
                        ? 'Owes'
                        : item.balance < 0
                          ? 'In credit'
                          : 'Settled'}
                    </span>
                  </span>
                  <span className="customer-row__activity">
                    {item.lastActivity ? formatDate(item.lastActivity) : 'New'}
                    <span>{item.entryCount} {item.entryCount === 1 ? 'entry' : 'entries'}</span>
                  </span>
                  <span className="customer-row__chevron">
                    <Icon name="chevron-right" size={18} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="list-footnote">
        <Icon name="shield" size={14} />
        Everything here is stored in this browser. Use Settings to back it up.
      </p>
    </div>
  )
}
