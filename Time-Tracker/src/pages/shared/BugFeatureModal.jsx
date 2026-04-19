import "../../css/modals/confirmModal.css";
import Button from "../../components/Button";

function BugFeatureModal({ form, onChange, onSave, onCancel, isEditing, isSaving = false }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{isEditing ? "Edit Request" : "New Request"}</h3>

        <div className="form-grid">
          <div className="form-row">
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="form-row">
            <label>Severity</label>
            <select
              value={form.severity}
              onChange={(e) => onChange("severity", e.target.value)}
              disabled={isSaving}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea
              rows="4"
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
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

export default BugFeatureModal;
