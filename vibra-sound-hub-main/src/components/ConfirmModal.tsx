import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = 'Confirmar',
  description = 'Tem certeza?',
  confirmText = 'OK',
  cancelText = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-background rounded-lg shadow-xl w-full max-w-xs p-6 relative">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <div className="mb-4 text-sm text-muted-foreground">{description}</div>
        <div className="flex gap-2 justify-end">
          <button
            className="px-4 py-1.5 rounded bg-muted text-foreground hover:bg-muted/70 text-sm"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className="px-4 py-1.5 rounded bg-primary text-white hover:bg-primary/80 text-sm disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Aguarde...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
