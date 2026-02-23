import { useState, useEffect } from "react";
import "../../css/modals/modal.css";

function AddEditContractModal({ isOpen, record, isViewMode, onSave, onClose }) {
    const [form, setForm] = useState({
        name: "",
        value: "",
        status: "",
        creationDate: "",
        estCompletionDate: "",
        owner: "",
        attachments: []
    });

    useEffect(() => {
        if (record) setForm(record);
    }, [record]);

    const update = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = () => {
        onSave(form);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{isViewMode ? "View Contract" : record ? "Edit Contract" : "Add Contract"}</h2>

                <div className="form-grid">
                    <div className="form-row">
                        <label>Contract Name</label>
                        <input
                            disabled={isViewMode}
                            value={form.name}
                            onChange={e => update("name", e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <label>Total Value</label>
                        <input type="number" disabled={isViewMode}  value={form.value}  onChange={e => update("value", e.target.value)}/>
                    </div>

                    <div className="form-row">
                        <label>Status</label>
                        <input disabled={isViewMode} value={form.status} onChange={e => update("status", e.target.value)} />
                    </div>

                    <div className="form-row">
                        <label>Creation Date</label>
                        <input type="date" disabled={isViewMode}  value={form.creationDate} onChange={e => update("creationDate", e.target.value)} />
                    </div>

                    <div className="form-row">
                        <label>Est Completion Date</label>
                        <input
                            type="date"
                            disabled={isViewMode}
                            value={form.estCompletionDate}
                            onChange={e => update("estCompletionDate", e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <label>Owner</label>
                        <input
                            disabled={isViewMode}
                            value={form.owner}
                            onChange={e => update("owner", e.target.value)}
                        />
                    </div>
                </div>

                {!isViewMode && (
                    <div className="modal-buttons">
                        <button className="btn-primary" onClick={handleSubmit}>Save</button>
                        <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AddEditContractModal;