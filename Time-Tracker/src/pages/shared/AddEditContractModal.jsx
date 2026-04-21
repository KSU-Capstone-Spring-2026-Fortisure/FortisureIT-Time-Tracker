import { useEffect, useState } from "react";
import "../../css/modals/modal.css";
import { sanitizeNumber, blockInvalidChars } from "./helpers";
import Button from "../../components/Button";

function AddEditContractModal({ isOpen, record, isViewMode, onSave, onClose }) {
  const [form, setForm] = useState({
    contract_name: "",
    description: "",
    total_value: "",
    start_date: "",
    end_date: "",
  });
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (record) {
      setForm({
        contract_name: record.contract_name || "",
        description: record.description || "",
        total_value: record.total_value || "",
        start_date: record.start_date ? record.start_date.split("T")[0] : "",
        end_date: record.end_date ? record.end_date.split("T")[0] : "",
      });
    } else {
      setForm({
        contract_name: "",
        description: "",
        total_value: "",
        start_date: "",
        end_date: "",
      });
    }
  }, [record]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setValidationError("");
  };

  const handleSubmit = async () => {
    if (!form.contract_name.trim()) {
      setValidationError("A contract name is required.");
      return;
    }

    if (!form.start_date) {
      setValidationError("A start date is required.");
      return;
    }

    if (!form.end_date) {
      setValidationError("An end date is required.");
      return;
    }

    if (new Date(form.end_date).getTime() < new Date(form.start_date).getTime()) {
      setValidationError("The contract end date cannot be before the start date.");
      return;
    }

    setValidationError("");
    await onSave(form);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isViewMode ? "View Contract" : record ? "Edit Contract" : "Add Contract"}</h2>

        <div className="form-grid">
          <div className="form-row">
            <label>Contract Name</label>
            <input disabled={isViewMode} value={form.contract_name} onChange={(e) => update("contract_name", e.target.value)} />
          </div>

          <div className="form-row">
            <label>Total Value</label>
            <input
              type="number"
              disabled={isViewMode}
              min="0"
              max="9223372036854775807"
              step="0.01"
              inputMode="decimal"
              onKeyDown={blockInvalidChars}
              value={form.total_value}
              onChange={(e) => update("total_value", sanitizeNumber(e.target.value))}
            />
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea disabled={isViewMode} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>

          <div className="form-row">
            <label>Start Date</label>
            <input type="date" disabled={isViewMode} value={form.start_date} onChange={(e) => update("start_date", e.target.value)} />
          </div>

          <div className="form-row">
            <label>End Date</label>
            <input type="date" disabled={isViewMode} value={form.end_date} onChange={(e) => update("end_date", e.target.value)} />
          </div>
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

export default AddEditContractModal;
