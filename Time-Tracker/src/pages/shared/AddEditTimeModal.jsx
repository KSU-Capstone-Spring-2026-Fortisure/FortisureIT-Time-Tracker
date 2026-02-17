import { useState, useEffect } from "react";
import "../../css/modals/addEditTimeModal.css";

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
          {isViewMode
            ? "View Hours"
            : record
            ? "Edit Hours"
            : "Add Hours"}
        </h2>

        <div className="form-grid">
          <div>
            <label>Client Name</label>
            <input
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              disabled={isViewMode}
            />
          </div>

          <div>
            <label>Date Worked</label>
            <input
              type="date"
              name="dateWorked"
              value={formData.dateWorked}
              onChange={handleChange}
              disabled={isViewMode}
            />
          </div>

          <div>
            <label>Time Worked</label>
            <input
              type="number"
              name="timeWorked"
              value={formData.timeWorked}
              onChange={handleChange}
              disabled={isViewMode}
            />
          </div>

          <div>
            <label>Category</label>
            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isViewMode}
            />
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                name="billable"
                checked={formData.billable}
                onChange={handleChange}
                disabled={isViewMode}
              />
              Billable
            </label>
          </div>
        </div>

        <div>
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={isViewMode}
          />
        </div>

        {!isViewMode && (
          <div className="modal-buttons">
            <button className="submit-btn" onClick={handleSubmit}>
              Save
            </button>
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        )}

        {isViewMode && (
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

export default AddEditModal;
