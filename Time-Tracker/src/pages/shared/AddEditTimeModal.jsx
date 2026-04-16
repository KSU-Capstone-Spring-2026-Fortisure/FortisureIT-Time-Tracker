import { useState, useEffect } from "react";
import "../../css/modals/modal.css";
import { sanitizeNumber } from "./helpers";
import { blockInvalidChars } from "./helpers";
import Button from "../../components/Button";

function AddEditModal({ isOpen, onClose, onSave, record, isViewMode }) {
  const [formData, setFormData] = useState({
    id: "",
    work_date: "",
    hours_worked: "",
    is_billable: false,
    notes: "",
  });

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
  }, [record]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Special handling for numeric field
    if (name === "hours_worked") {
      const sanitized = sanitizeNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: sanitized,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>
          {isViewMode ? "View Hours" : record ? "Edit Hours" : "Add Hours"}
        </h2>

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
              max="9223372036854775807"
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
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={isViewMode}
          />
        </div>

        {!isViewMode && (
          <div className="modal-footer spaced">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>

            <Button variant="primary" pop onClick={handleSubmit}>
              Save
            </Button>
          </div>
        )}

        {isViewMode && (
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

export default AddEditModal;