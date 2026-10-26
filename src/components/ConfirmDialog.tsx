import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="modal--confirm"
      labelledBy="confirm-title"
    >
      <div className="modal__head">
        <div>
          <span className="eyebrow">Please confirm</span>
          <h2 id="confirm-title">{title}</h2>
        </div>
      </div>
      <div className="modal__body">
        <p className="muted">{body}</p>
      </div>
      <div className="modal__foot">
        <button type="button" className="btn btn--quiet" onClick={onClose}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}`}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
