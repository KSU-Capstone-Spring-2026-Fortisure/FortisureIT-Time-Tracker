import "../css/modals/confirmModal.css";
import Button from "./Button";

function ConfirmModal({
  message,
  children,
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  isLoading = false,
  loadingMessage = "",
}) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        {message ? <p style={{ whiteSpace: "pre-line" }}>{message}</p> : null}
        {loadingMessage ? (
          <p style={{ color: "#4b5563", fontWeight: 600, marginTop: "8px", whiteSpace: "pre-line" }}>
            {loadingMessage}
          </p>
        ) : null}
        {children}

        <div className="modal-footer spaced">
          <Button variant="secondary" pop onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
