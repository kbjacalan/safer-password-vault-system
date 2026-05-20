import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
import "./ConfirmModal.css";

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="cm-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="cm-dialog" role="dialog" aria-modal="true">
        <div className={`cm-icon-wrap cm-icon-wrap--${variant}`}>
          {variant === "danger" ? (
            <AlertTriangle size={20} />
          ) : (
            <RotateCcw size={20} />
          )}
        </div>

        <div className="cm-body">
          <h3 className="cm-title">{title}</h3>
          <p className="cm-message">{message}</p>
        </div>

        <div className="cm-actions">
          <button
            className="cm-btn cm-btn--cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`cm-btn cm-btn--confirm cm-btn--${variant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 size={13} className="cm-spinner" />}
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmModal;
