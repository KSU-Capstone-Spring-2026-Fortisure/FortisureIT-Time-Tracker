import { sanitizeNumber } from "../shared/helpers";
import "../../css/modals/milestoneModal.css";
import { blockInvalidChars } from "./helpers";
import Button from "../../components/Button";

function MilestoneModal({
  form,
  onChange,
  onSave,
  onCancel,
  isEditing,
  isSaving = false,
  isViewMode = false,
  errorMessage = "",
}) {
  const handleAmountChange = (e) => {
    const raw = e.target.value;
    const sanitized = sanitizeNumber(raw);
    onChange("amount", sanitized);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{isViewMode ? "View Milestone" : isEditing ? "Edit Milestone" : "Add Milestone"}</h3>

        <div className="form-grid">
          <div className="form-row">
            <label>Milestone Name</label>
            <input
              value={form.milestone_name}
              onChange={(e) => onChange("milestone_name", e.target.value)}
              disabled={isSaving || isViewMode}
            />
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              disabled={isSaving || isViewMode}
            />
          </div>

          <div className="form-row">
            <label>Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => onChange("due_date", e.target.value)}
              disabled={isSaving || isViewMode}
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
              disabled={isSaving || isViewMode}
            />
          </div>
        </div>

        {errorMessage ? <p style={{ color: "#b91c1c", fontWeight: 600 }}>{errorMessage}</p> : null}

        <div className="modal-footer spaced">
          <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>

          {!isViewMode ? (
            <Button variant="primary" pop onClick={onSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default MilestoneModal;
