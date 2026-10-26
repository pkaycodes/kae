import type { Currency } from '../types'
import { formatMoney } from './money'
import { firstName } from './phone'

export function paymentReminder(
  shopName: string,
  customerName: string,
  balanceMinor: number,
  currency: Currency,
): string {
  return `Hello ${firstName(customerName)}, this is ${shopName}. Our records show a balance of ${formatMoney(
    balanceMinor,
    currency,
  )} on your account. Please let me know when you can settle. Thank you.`
}

export function friendlyGreeting(shopName: string, customerName: string): string {
  return `Hello ${firstName(customerName)}, this is ${shopName}. Thank you for your business.`
}
