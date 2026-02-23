import { useState, useEffect } from "react";
import "../../css/modals/modal.css";

function AddEditModal({ isOpen, onClose, onSave, record, isViewMode }) {
  const [formData, setFormData] = useState({
    id: "",
    clientName: "",
    dateWorked: "",
    timeWorked: "",
    category: "",
    billable: false,
    notes: ""
  });

  useEffect(() => {
    if (record) {
      setFormData(record);
    } else {
      setFormData({
        id: "",
        clientName: "",
        dateWorked: "",
        timeWorked: "",
        category: "",
        billable: false,
        notes: ""
      });
    }
  }, [record]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
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
            <label>Client Name</label>
            <input name="clientName" value={formData.clientName} onChange={handleChange} disabled={isViewMode} />
          </div>

          <div>
            <div className="form-row">
              <label>Date Worked</label>
              <input type="date" name="dateWorked" value={formData.dateWorked} onChange={handleChange} disabled={isViewMode} />
            </div>
          </div>

          <div>
            <div className="form-row">
              <label>Time Worked</label>
              <input type="number" name="timeWorked" value={formData.timeWorked} onChange={handleChange} disabled={isViewMode} />
            </div>
          </div>

          <div>
            <div className="form-row">
              <label>Category</label>
              <input name="category" value={formData.category} onChange={handleChange} disabled={isViewMode} />
            </div>
          </div>

          <div>
            <div className="form-row">
              <label>Billable</label>
              <div className="checkbox-wrapper">
                <input type="checkbox" name="billable" checked={formData.billable} onChange={handleChange} disabled={isViewMode} />
              </div>
            </div>

          </div>
        </div>

        <div>
          <div className="form-row">
            <label>Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} disabled={isViewMode} />
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
    </div >
  );
}

export default AddEditModal;
