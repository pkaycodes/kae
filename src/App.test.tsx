import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './lib/storage'

async function startFreshShop(user: ReturnType<typeof userEvent.setup>) {
  render(<App />)
  await user.type(screen.getByLabelText('Shop name'), 'Adom Provisions')
  await user.click(screen.getByRole('button', { name: 'Start my ledger' }))
}

describe('Kae app', () => {
  it('opens with onboarding and loads a sample ledger', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { name: /small shop/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Explore a sample shop/i }))

    expect(await screen.findByTestId('outstanding-total')).toHaveTextContent('GH₵496.00')
    expect(screen.getAllByText('Ama Mensah').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/sample shop/i).length).toBeGreaterThan(0)
  })

  it('starts a fresh ledger and adds a customer with an opening balance', async () => {
    const user = userEvent.setup()
    await startFreshShop(user)

    expect(
      screen.getByRole('heading', { name: /who owes you/i }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /Add your first customer/i }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Full name'), 'Yaa Asantewaa')
    await user.type(within(dialog).getByLabelText(/Opening balance/i), '50')
    await user.click(within(dialog).getByRole('button', { name: 'Add customer' }))

    expect(await screen.findByTestId('customer-balance')).toHaveTextContent('GH₵50.00')
    await waitFor(() =>
      expect(localStorage.getItem(STORAGE_KEY)).toContain('Yaa Asantewaa'),
    )
  })

  it('records a payment against an existing balance', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Explore a sample shop/i }))
    await screen.findByTestId('outstanding-total')

    const debtorsCard = screen
      .getByRole('heading', { name: 'Who owes you' })
      .closest('.card') as HTMLElement
    await user.click(
      within(debtorsCard).getByRole('button', { name: /^Ama Mensah/ }),
    )
    const drawer = await screen.findByRole('dialog', { name: 'Ama Mensah' })
    expect(within(drawer).getByTestId('customer-balance')).toHaveTextContent('GH₵240.00')

    await user.click(within(drawer).getByRole('button', { name: /They paid/i }))
    const form = await screen.findByRole('dialog', { name: /Record a payment/i })
    await user.type(within(form).getByLabelText(/Amount received/i), '60')
    await user.click(within(form).getByRole('button', { name: 'Record payment' }))

    await waitFor(() =>
      expect(screen.getByTestId('customer-balance')).toHaveTextContent('GH₵180.00'),
    )
    expect(screen.getByText('Payment recorded.')).toBeInTheDocument()
  })

  it('ignores corrupt local storage instead of crashing', async () => {
    localStorage.setItem(STORAGE_KEY, '{not-json')
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /small shop/i }),
    ).toBeInTheDocument()
  })
})
