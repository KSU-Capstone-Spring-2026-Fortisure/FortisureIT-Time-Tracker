import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/bugfeaturerequest.css";

function BugFeatureRequest() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        severity: "Low",
        description: "",
        attachments: []
    });

    const update = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = () => {
        console.log("Submitted:", form);
        navigate(-1);
    };

    return (
        <div className="bug-report">

            <div className="header-row">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <h1>Report Bugs & Feature Requests</h1>
            </div>

            <div className="divider" />

            <label>Title</label>
            <input
                value={form.title}
                onChange={e => update("title", e.target.value)}
            />

            <label>Severity</label>
            <select
                value={form.severity}
                onChange={e => update("severity", e.target.value)}
            >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
            </select>

            <label>Description</label>
            <textarea
                value={form.description}
                onChange={e => update("description", e.target.value)}
            />

            <button className="submit-btn" onClick={handleSubmit}>
                Submit
            </button>
        </div>
    );
}

export default BugFeatureRequest;