import { sanitizeNumber } from "../shared/helpers";
import "../../css/modals/milestoneModal.css";
import { blockInvalidChars } from "./helpers";
import Button from "../../components/Button";

function MilestoneModal({ form, onChange, onSave, onCancel, isEditing, isSaving = false }) {
  const handleAmountChange = (e) => {
    const raw = e.target.value;
    const sanitized = sanitizeNumber(raw);
    onChange("amount", sanitized);
  };

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
              disabled={isSaving}
            />
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="form-row">
            <label>Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => onChange("due_date", e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="form-row">
            <label>Amount</label>
            <input
              type="number"
              min="0"
              max="9223372036854775807"
              step="0.01"
              inputMode="decimal"
              onKeyDown={blockInvalidChars}
              value={form.amount}
              onChange={handleAmountChange}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="modal-footer spaced">
          <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>

          <Button variant="primary" pop onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MilestoneModal;
