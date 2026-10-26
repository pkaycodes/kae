export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, '')
}

/**
 * Turns a local phone number into an international number usable with wa.me.
 * Defaults to Ghana, where a leading 0 is replaced with +233. Numbers that
 * already include a country code are kept as they are.
 */
export function toInternationalPhone(raw: string): string | null {
  let digits = phoneDigits(raw)
  if (!digits) return null
  if (digits.startsWith('00')) digits = digits.slice(2)

  if (digits.startsWith('233')) {
    return digits.length >= 11 && digits.length <= 13 ? digits : null
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `233${digits.slice(1)}`
  }
  if (digits.length === 9) {
    return `233${digits}`
  }
  if (digits.length >= 8 && digits.length <= 15) {
    return digits
  }
  return null
}

export function whatsappLink(raw: string, message: string): string | null {
  const phone = toInternationalPhone(raw)
  if (!phone) return null
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function displayPhone(raw: string): string {
  const digits = phoneDigits(raw)
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  if (digits.length === 12 && digits.startsWith('233')) {
    return `+233 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
  }
  return raw
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}
