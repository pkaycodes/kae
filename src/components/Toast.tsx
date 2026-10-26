import { Icon } from './Icon'

interface ToastProps {
  message: string
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast__icon">
        <Icon name="check" size={16} strokeWidth={2.2} />
      </span>
      <span className="toast__text">{message}</span>
      <button
        type="button"
        className="toast__close"
        onClick={onDismiss}
        aria-label="Dismiss message"
      >
        <Icon name="x" size={15} />
      </button>
    </div>
  )
}
