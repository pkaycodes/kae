import { useState, type FormEvent } from 'react'
import type { Currency } from '../types'
import { CURRENCIES } from '../lib/money'
import { Icon } from '../components/Icon'

interface OnboardingProps {
  onStart: (shopName: string, ownerName: string, currency: Currency) => void
  onSample: () => void
}

export function Onboarding({ onStart, onSample }: OnboardingProps) {
  const [shopName, setShopName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [currency, setCurrency] = useState<Currency>('GHS')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!shopName.trim()) {
      setError('Give your shop a name first.')
      return
    }
    onStart(shopName, ownerName, currency)
  }

  return (
    <main className="onboarding">
      <section className="onboarding__story">
        <div className="wordmark wordmark--light">
          Kae<span className="wordmark__dot">.</span>
        </div>

        <div className="onboarding__headline">
          <span className="eyebrow eyebrow--gold">A ledger for the corner shop</span>
          <h1>
            The small shop’s <em>memory.</em>
          </h1>
          <p>
            Know who owes you, what they have paid, and what is left — even when
            the network drops.
          </p>
        </div>

        <div className="ledger-preview" aria-hidden="true">
          <div className="ledger-preview__head">
            <span>Owing today</span>
            <strong>GH₵ 496.00</strong>
          </div>
          <div className="ledger-preview__row">
            <span className="ledger-preview__avatar">AM</span>
            <span>Ama Mensah</span>
            <b>240.00</b>
          </div>
          <div className="ledger-preview__row">
            <span className="ledger-preview__avatar">KB</span>
            <span>Kofi Boateng</span>
            <b>100.00</b>
          </div>
          <div className="ledger-preview__row">
            <span className="ledger-preview__avatar">AO</span>
            <span>Akosua Owusu</span>
            <b>96.00</b>
          </div>
          <div className="ledger-preview__row ledger-preview__row--paid">
            <span className="ledger-preview__avatar">EA</span>
            <span>Esi Adjei</span>
            <b>Settled</b>
          </div>
          <div className="ledger-preview__foot">
            <span>Last payment</span>
            <span>Today, 4:10 pm</span>
          </div>
        </div>

        <ul className="onboarding__points">
          <li>
            <Icon name="wifi-off" size={18} />
            <span>
              <strong>Works offline.</strong> Your ledger is saved on this device.
            </span>
          </li>
          <li>
            <Icon name="shield" size={18} />
            <span>
              <strong>No account, no tracking.</strong> Nothing is sent to a server.
            </span>
          </li>
          <li>
            <Icon name="install" size={18} />
            <span>
              <strong>Lives on your phone.</strong> Install it like an app.
            </span>
          </li>
        </ul>
      </section>

      <section className="onboarding__panel">
        <form className="onboarding__form" onSubmit={handleSubmit} noValidate>
          <span className="eyebrow">Open your ledger</span>
          <h2>Start with your shop.</h2>
          <p className="muted">
            One minute to set up. No email, no password, no monthly fee.
          </p>

          <label className="field">
            <span className="field__label">Shop name</span>
            <input
              autoFocus
              value={shopName}
              onChange={(event) => {
                setShopName(event.target.value)
                setError('')
              }}
              placeholder="e.g. Adom Provisions"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'shop-name-error' : undefined}
            />
            {error ? (
              <span className="field__error" id="shop-name-error">
                {error}
              </span>
            ) : null}
          </label>

          <div className="onboarding__row">
            <label className="field">
              <span className="field__label">Your name (optional)</span>
              <input
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                placeholder="e.g. Ama"
                autoComplete="given-name"
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
            </label>
          </div>

          <button type="submit" className="btn btn--accent btn--wide btn--lg">
            Start my ledger
            <Icon name="arrow-up-right" size={18} />
          </button>

          <button
            type="button"
            className="btn btn--quiet btn--wide"
            onClick={onSample}
          >
            Explore a sample shop
          </button>

          <p className="onboarding__privacy">
            <Icon name="shield" size={15} />
            Your customers’ details stay in this browser. Back them up from
            Settings whenever you like.
          </p>
        </form>

        <p className="onboarding__place">
          Made in Accra for shops that run on trust.
        </p>
      </section>
    </main>
  )
}
