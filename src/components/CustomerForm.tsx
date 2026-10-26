import { useState, type FormEvent } from 'react'
import type { Customer, Currency, NewCustomerInput } from '../types'
import { currencySymbol, parseMoneyOrZero } from '../lib/money'
import { Icon } from './Icon'
import { Modal } from './Modal'

interface CustomerFormProps {
  open: boolean
  mode: 'new' | 'edit'
  customer?: Customer
  currency: Currency
  onClose: () => void
  onSubmit: (input: NewCustomerInput) => void
}

export function CustomerForm({
  open,
  mode,
  customer,
  currency,
  onClose,
  onSubmit,
}: CustomerFormProps) {
  const [name, setName] = useState(customer?.name ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [note, setNote] = useState(customer?.note ?? '')
  const [opening, setOpening] = useState('')
  const [error, setError] = useState('')

  const editing = mode === 'edit'

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('A customer needs a name.')
      return
    }
    const openingMinor = editing ? 0 : parseMoneyOrZero(opening)
    if (openingMinor === null) {
      setError('Opening balance must be an amount like 120.00, or left empty.')
      return
    }
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      note: note.trim(),
      openingMinor,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="modal--form"
      labelledBy="customer-form-title"
    >
      <form onSubmit={handleSubmit}>
        <div className="modal__head">
          <div>
            <span className="eyebrow">{editing ? 'Customer details' : 'New customer'}</span>
            <h2 id="customer-form-title">
              {editing ? 'Edit customer' : 'Who is buying on credit?'}
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
          <label className="field">
            <span className="field__label">Full name</span>
            <input
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setError('')
              }}
              placeholder="e.g. Ama Mensah"
              autoComplete="off"
            />
          </label>

          <label className="field">
            <span className="field__label">Phone number (optional)</span>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="024 555 0192"
              autoComplete="off"
            />
            <span className="field__hint">
              Used only for WhatsApp payment reminders.
            </span>
          </label>

          <label className="field">
            <span className="field__label">Note (optional)</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Anything you want to remember about this customer."
              rows={3}
            />
          </label>

          {!editing ? (
            <label className="field">
              <span className="field__label">
                Opening balance (optional)
              </span>
              <div className="input-money">
                <span>{currencySymbol(currency)}</span>
                <input
                  inputMode="decimal"
                  value={opening}
                  onChange={(event) => {
                    setOpening(event.target.value)
                    setError('')
                  }}
                  placeholder="0.00"
                />
              </div>
              <span className="field__hint">
                Money they already owed you before Kae. Leave empty for a clean
                slate.
              </span>
            </label>
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
          <button type="submit" className="btn btn--primary">
            {editing ? 'Save changes' : 'Add customer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
