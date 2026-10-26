const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export function todayISO(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDaysISO(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number)
  return todayISO(new Date(year, month - 1, day + days, 12))
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

export function formatDate(iso: string, options?: { withYear?: boolean }): string {
  if (!isIsoDate(iso)) return iso
  const today = todayISO()
  if (iso === today) return 'Today'
  if (iso === addDaysISO(today, -1)) return 'Yesterday'

  const date = parseISODate(iso)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: options?.withYear || !sameYear ? 'numeric' : undefined,
  }).format(date)
}

export function longDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now)
}

export function weekdayShort(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(
    parseISODate(iso),
  )
}

export function dayNumber(iso: string): string {
  return String(parseISODate(iso).getDate())
}

export function greeting(now = new Date()): string {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
