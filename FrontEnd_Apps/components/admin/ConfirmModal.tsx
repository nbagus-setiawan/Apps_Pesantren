'use client';

import { Modal } from '@/components/Modal';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  submitting?: boolean;
  danger?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Ya, Lanjutkan',
  submitting = false,
  danger = true,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button
            className={danger ? 'btn-danger-ghost' : 'btn-primary'}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? 'Memproses…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm text-neutral-700">{description}</div>
    </Modal>
  );
}
