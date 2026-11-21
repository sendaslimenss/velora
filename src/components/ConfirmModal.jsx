import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ConfirmModal({
  isOpen,
  eyebrow = "CONFIRMATION REQUISE",
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="velora-modal-backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="velora-confirm-title"
    >
      <div
        className="velora-modal-card velora-confirm-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="velora-modal-header">
          <div>
            <span className="velora-eyebrow mb-1">{eyebrow}</span>
            <h2 id="velora-confirm-title" className="velora-modal-title">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="velora-modal-close"
            onClick={onCancel}
            aria-label="Fermer la confirmation"
          >
            ×
          </button>
        </div>

        <p className="velora-confirm-message">{message}</p>

        <div className="d-flex justify-content-end gap-2 flex-wrap pt-2">
          <button
            type="button"
            className="velora-btn velora-btn-outline"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="velora-btn velora-btn-gold"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}