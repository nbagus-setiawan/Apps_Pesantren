'use client';

import { useEffect } from 'react';
import clsx from 'clsx';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

/**
 * Modal generik dipakai lintas modul (form tambah/edit, import, konfirmasi).
 * Dibuat karena beberapa modul (Data Santri, dst.) butuh dialog di atas
 * konten tabel tanpa navigasi halaman penuh.
 */
export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Tutup" className="absolute inset-0 bg-neutral-900/50" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={clsx(
          'relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-card bg-white shadow-soft',
          SIZE_CLASSES[size]
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 id="modal-title" className="text-h3 text-neutral-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && <div className="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
