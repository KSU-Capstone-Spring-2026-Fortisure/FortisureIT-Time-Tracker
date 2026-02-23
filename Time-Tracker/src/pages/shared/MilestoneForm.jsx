import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "../../css/modals/milestoneForm.css"

function MilestoneForm({ initialData }) {
    const navigate = useNavigate();
    const { clientId, contractId, milestoneId } = useParams();
    const location = useLocation();
    const saveHandler = location.state?.onSave;

    const [form, setForm] = useState({
        name: "",
        value: "",
        assignee: "",
        estBillDate: "",
        approved: false
    });

    useEffect(() => {
        if (initialData) {
            setForm(initialData);
        }
    }, [initialData]);

    const update = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = () => {
        if (saveHandler) {
            saveHandler(form);
        }
        navigate(`/contracts/${clientId}/milestones/${contractId}`);
    };

    return (
        <div className="milestone-form-page">

            <div className="header-row">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <h1>{milestoneId ? "Edit Milestone" : "Add Milestone"}</h1>
            </div>

            <div className="divider" />

            <div className="form-container">
                <label>Milestone Name</label>
                <input value={form.name} onChange={e => update("name", e.target.value)} />

                <label>Value</label>
                <input type = "number" value={form.value} onChange={e => update("value", e.target.value)} />

                <label>Assignee</label>
                <input  value={form.assignee} onChange={e => update("assignee", e.target.value)} />

                <label>Est Bill Date</label>
                <input type="date" value={form.estBillDate} onChange={e => update("estBillDate", e.target.value)} />

                <label>
                    Approved {" "}
                    <input type="checkbox" checked={form.approved} onChange={e => update("approved", e.target.checked)} />
                </label>

                <button className="submit-btn" onClick={handleSubmit}>
                    Save
                </button>
            </div>
        </div>
    );
}

export default MilestoneForm;