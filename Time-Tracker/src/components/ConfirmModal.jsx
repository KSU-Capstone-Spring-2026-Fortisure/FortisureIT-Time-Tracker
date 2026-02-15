import "../css/modals/confirmModal.css";

function ConfirmModal({ message, onCancel, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>

        <div className="modal-actions">
          <button className="primary-btn" onClick={onConfirm}>
            Confirm
          </button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
