import "../css/modals/confirmModal.css";

function ResultModal({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        <div className="modal-actions">
          <button className="primary-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultModal;