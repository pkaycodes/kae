import { useState, type FormEvent } from 'react'
import type {
  Currency,
  Customer,
  EntryKind,
  NewEntryInput,
  PaymentMethod,
} from '../types'
import { inputFromMinor, currencySymbol, formatMoney, parseMoneyInput } from '../lib/money'
import { isIsoDate, todayISO } from '../lib/date'
import { Icon } from './Icon'
import { Modal } from './Modal'

interface EntryFormProps {
  open: boolean
  customer: Customer
  currentBalance: number
  currency: Currency
  initialKind: EntryKind
  onClose: () => void
  onSubmit: (input: NewEntryInput) => void
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'momo', label: 'Mobile money' },
  { value: 'bank', label: 'Bank' },
  { value: 'other', label: 'Other' },
]

export function EntryForm({
  open,
  customer,
  currentBalance,
  currency,
  initialKind,
  onClose,
  onSubmit,
}: EntryFormProps) {
  const [kind, setKind] = useState<EntryKind>(initialKind)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [error, setError] = useState('')

  const parsed = parseMoneyInput(amount)
  const nextBalance =
    parsed === null
      ? null
      : currentBalance + (kind === 'credit' ? parsed : -parsed)

  function handleKind(next: EntryKind) {
    setKind(next)
    setError('')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (parsed === null) {
      setError('Enter an amount greater than zero, like 120.00.')
      return
    }
    if (!isIsoDate(date)) {
      setError('Choose a valid date.')
      return
    }
    if (date > todayISO()) {
      setError('The date cannot be in the future.')
      return
    }
    onSubmit({
      customerId: customer.id,
      kind,
      amountMinor: parsed,
      note,
      date,
      method: kind === 'payment' ? method : undefined,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="modal--form"
      labelledBy="entry-form-title"
    >
      <form onSubmit={handleSubmit}>
        <div className="modal__head">
          <div>
            <span className="eyebrow">{customer.name}</span>
            <h2 id="entry-form-title">
              {kind === 'payment' ? 'Record a payment' : 'Give credit'}
            </h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="modal__body">
          <div className="segment" role="group" aria-label="Entry type">
            <button
              type="button"
              className={`segment__btn ${kind === 'payment' ? 'is-active' : ''}`}
              aria-pressed={kind === 'payment'}
              onClick={() => handleKind('payment')}
            >
              <Icon name="download" size={16} />
              They paid
            </button>
            <button
              type="button"
              className={`segment__btn ${kind === 'credit' ? 'is-active' : ''}`}
              aria-pressed={kind === 'credit'}
              onClick={() => handleKind('credit')}
            >
              <Icon name="upload" size={16} />
              Gave credit
            </button>
          </div>

          <div className="balance-strip">
            <span>Current balance</span>
            <strong>{formatMoney(currentBalance, currency)}</strong>
          </div>

          <label className="field">
            <span className="field__label">
              {kind === 'payment' ? 'Amount received' : 'Amount owed'}
            </span>
            <div className="input-money input-money--lg">
              <span>{currencySymbol(currency)}</span>
              <input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value)
                  setError('')
                }}
                placeholder="0.00"
              />
            </div>
            {kind === 'payment' && currentBalance > 0 ? (
              <div className="quick-amounts">
                <button
                  type="button"
                  onClick={() => setAmount(inputFromMinor(currentBalance))}
                >
                  Full balance {formatMoney(currentBalance, currency)}
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(inputFromMinor(Math.ceil(currentBalance / 2)))}
                >
                  Half
                </button>
              </div>
            ) : null}
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Date</span>
              <input
                type="date"
                value={date}
                max={todayISO()}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            {kind === 'payment' ? (
              <label className="field">
                <span className="field__label">How did they pay?</span>
                <select
                  value={method}
                  onChange={(event) => setMethod(event.target.value as PaymentMethod)}
                >
                  {METHODS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <label className="field">
            <span className="field__label">Note (optional)</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                kind === 'payment'
                  ? 'e.g. Part payment by MoMo'
                  : 'e.g. Rice, oil and tinned tomatoes'
              }
            />
          </label>

          {nextBalance !== null ? (
            <div className="balance-preview" data-testid="balance-preview">
              <span>New balance</span>
              <strong>
                {nextBalance === 0
                  ? 'Settled'
                  : nextBalance < 0
                    ? `${formatMoney(Math.abs(nextBalance), currency)} in credit`
                    : formatMoney(nextBalance, currency)}
              </strong>
            </div>
          ) : null}

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="modal__foot">
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={`btn ${kind === 'payment' ? 'btn--green' : 'btn--primary'}`}
          >
            {kind === 'payment' ? 'Record payment' : 'Add credit'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
