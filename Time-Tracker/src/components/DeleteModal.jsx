function DeleteModal({ isOpen, onCancel, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Are you sure you want to delete this item?</h3>

        <div className="modal-actions">
          <button className="danger-btn" onClick={onConfirm}>
            Confirm
          </button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;