import "../css/modals/confirmModal.css";
import Button from "./Button";

function ConfirmModal({ message, onCancel, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>

        <div className="modal-footer spaced">
          <Button variant="secondary" pop onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;