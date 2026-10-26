import { initials } from '../lib/text'

const TONES = 5

function toneFor(name: string): number {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0
  }
  return hash % TONES
}

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <span
      className={`avatar avatar--${toneFor(name)} avatar--${size}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
