import { useEffect, useState } from "react";
import "../../css/modals/modal.css";
import { sanitizeNumber, blockInvalidChars } from "./helpers";
import Button from "../../components/Button";

function AddEditModal({ isOpen, onClose, onSave, record, isViewMode }) {
  const [formData, setFormData] = useState({
    id: "",
    work_date: "",
    hours_worked: "",
    is_billable: false,
    notes: "",
  });
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (record) {
      setFormData({
        id: record.id || "",
        work_date: record.work_date ? record.work_date.split("T")[0] : "",
        hours_worked: record.hours_worked || "",
        is_billable: record.is_billable || false,
        notes: record.notes || "",
      });
    } else {
      setFormData({
        id: "",
        work_date: "",
        hours_worked: "",
        is_billable: false,
        notes: "",
      });
    }

    setValidationError("");
  }, [record]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "hours_worked") {
      const sanitized = sanitizeNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: sanitized,
      }));
      setValidationError("");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    const hoursWorked = Number(formData.hours_worked || 0);

    if (!formData.work_date) {
      setValidationError("A work date is required.");
      return;
    }

    if (!Number.isFinite(hoursWorked) || hoursWorked <= 0) {
      setValidationError("Hours worked must be greater than 0.");
      return;
    }

    if (hoursWorked > 24) {
      setValidationError("A single time entry cannot exceed 24 hours in one day.");
      return;
    }

    setValidationError("");
    await onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isViewMode ? "View Hours" : record ? "Edit Hours" : "Add Hours"}</h2>

        <div className="form-grid">
          <div className="form-row">
            <label>Date Worked</label>
            <input
              type="date"
              name="work_date"
              value={formData.work_date}
              onChange={handleChange}
              disabled={isViewMode}
            />
          </div>

          <div className="form-row">
            <label>Hours Worked</label>
            <input
              type="number"
              name="hours_worked"
              min="0"
              max="24"
              step="0.01"
              inputMode="decimal"
              onKeyDown={blockInvalidChars}
              value={formData.hours_worked}
              onChange={handleChange}
              disabled={isViewMode}
            />
          </div>

          <div className="form-row">
            <label>Billable</label>
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                name="is_billable"
                checked={formData.is_billable}
                onChange={handleChange}
                disabled={isViewMode}
              />
            </div>
          </div>
        </div>

        <div className="form-row">
          <label>Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} disabled={isViewMode} />
        </div>

        {validationError ? <p style={{ color: "#b91c1c", fontWeight: 600 }}>{validationError}</p> : null}

        {!isViewMode ? (
          <div className="modal-footer spaced">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>

            <Button variant="primary" pop onClick={handleSubmit}>
              Save
            </Button>
          </div>
        ) : (
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

export default AddEditModal;
