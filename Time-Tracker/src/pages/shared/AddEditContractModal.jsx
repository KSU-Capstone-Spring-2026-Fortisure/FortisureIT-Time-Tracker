import { useState, useEffect } from "react";
import "../../css/modals/modal.css";

function AddEditContractModal({ isOpen, record, isViewMode, onSave, onClose }) {
  const [form, setForm] = useState({
    contract_name: "",
    description: "",
    total_value: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (record) {
      setForm({
        contract_name: record.contract_name || "",
        description: record.description || "",
        total_value: record.total_value || "",
        start_date: record.start_date
          ? record.start_date.split("T")[0]
          : "",
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
  };

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>
          {isViewMode
            ? "View Contract"
            : record
            ? "Edit Contract"
            : "Add Contract"}
        </h2>

        <div className="form-grid">
          <div className="form-row">
            <label>Contract Name</label>
            <input
              disabled={isViewMode}
              value={form.contract_name}
              onChange={(e) => update("contract_name", e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Total Value</label>
            <input
              type="number"
              disabled={isViewMode}
              value={form.total_value}
              onChange={(e) => update("total_value", e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea
              disabled={isViewMode}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Start Date</label>
            <input
              type="date"
              disabled={isViewMode}
              value={form.start_date}
              onChange={(e) => update("start_date", e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>End Date</label>
            <input
              type="date"
              disabled={isViewMode}
              value={form.end_date}
              onChange={(e) => update("end_date", e.target.value)}
            />
          </div>
        </div>

        {!isViewMode && (
          <div className="modal-buttons">
            <button className="btn-primary" onClick={handleSubmit}>
              Save
            </button>
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
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

export default AddEditContractModal;