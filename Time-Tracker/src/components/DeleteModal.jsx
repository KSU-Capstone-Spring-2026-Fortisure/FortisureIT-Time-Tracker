import Button from "./Button";

function DeleteModal({ isOpen, onCancel, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Are you sure you want to delete this item?</h3>

        <div className="modal-footer spaced">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>

            <Button variant="danger" pop onClick={onConfirm}>
              Confirm
            </Button>
          </div>
      </div>
    </div>
  );
}

export default DeleteModal;