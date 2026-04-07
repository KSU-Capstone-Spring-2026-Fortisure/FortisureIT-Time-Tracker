import "../../css/modals/milestoneModal.css";

function MilestoneModal({ form, onChange, onSave, onCancel, isEditing }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{isEditing ? "Edit Milestone" : "Add Milestone"}</h3>

        <div className="form-grid">

          <div className="form-row">
            <label>Milestone Name</label>
            <input
              value={form.milestone_name}
              onChange={(e) => onChange("milestone_name", e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => onChange("due_date", e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => onChange("amount", e.target.value)}
            />
          </div>

        </div>

        <div className="modal-actions">
          <button className="primary-btn" onClick={onSave}>
            Save
          </button>
          <button className="secondary-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default MilestoneModal;