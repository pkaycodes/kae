import type { Customer, Database, Entry, PaymentMethod } from '../types'
import { addDaysISO, todayISO } from '../lib/date'

function customer(id: string, name: string, phone: string, note: string, daysAgo: number): Customer {
  const date = addDaysISO(todayISO(), -daysAgo)
  return {
    id,
    name,
    phone,
    note,
    createdAt: `${date}T08:00:00.000Z`,
  }
}

function entry(
  id: string,
  customerId: string,
  kind: Entry['kind'],
  amountMinor: number,
  note: string,
  daysAgo: number,
  method?: PaymentMethod,
): Entry {
  const date = addDaysISO(todayISO(), -daysAgo)
  return {
    id,
    customerId,
    kind,
    amountMinor,
    note,
    date,
    method,
    createdAt: `${date}T${kind === 'payment' ? '16' : '10'}:00:00.000Z`,
  }
}

/**
 * A believable week at a neighbourhood provisions shop. All dates are relative
 * to today so the demo dashboard always looks alive.
 */
export function createSampleDb(): Database {
  const customers: Customer[] = [
    customer('cus_ama', 'Ama Mensah', '024 555 0192', 'Buys provisions on credit every month.', 30),
    customer('cus_kofi', 'Kofi Boateng', '020 144 8821', 'Pays by MoMo when his salary lands.', 26),
    customer('cus_akosua', 'Akosua Owusu', '055 902 3314', '', 18),
    customer('cus_yaw', 'Yaw Darko', '027 318 7740', 'Drinks for the family funeral.', 20),
    customer('cus_esi', 'Esi Adjei', '024 771 2288', 'Settled her account in full.', 33),
  ]

  const entries: Entry[] = [
    entry('ent_esi_1', 'cus_esi', 'credit', 15000, 'Textbooks for the children', 14),
    entry('ent_kofi_1', 'cus_kofi', 'credit', 25000, 'Bag of rice and cooking oil', 12),
    entry('ent_ama_1', 'cus_ama', 'credit', 30000, 'Rice, oil and tinned tomatoes', 10),
    entry('ent_yaw_1', 'cus_yaw', 'credit', 16000, 'Drinks for a funeral', 8, undefined),
    entry('ent_kofi_2', 'cus_kofi', 'payment', 6450, 'Part payment by MoMo', 6, 'momo'),
    entry('ent_esi_2', 'cus_esi', 'payment', 15000, 'Full settlement by MoMo', 5, 'momo'),
    entry('ent_ama_2', 'cus_ama', 'credit', 12000, 'Two crates of eggs', 4),
    entry('ent_akosua_1', 'cus_akosua', 'credit', 9600, 'Provisions for the week', 3),
    entry('ent_ama_3', 'cus_ama', 'payment', 18000, 'Part payment in cash', 2, 'cash'),
    entry('ent_yaw_2', 'cus_yaw', 'payment', 10000, 'Cash payment', 1, 'cash'),
    entry('ent_kofi_3', 'cus_kofi', 'payment', 8550, 'Balance from his salary', 0, 'momo'),
  ]

  return {
    version: 1,
    customers,
    entries,
    settings: {
      shopName: 'Adom Provisions',
      ownerName: 'Ama',
      currency: 'GHS',
      isDemo: true,
    },
  }
}
