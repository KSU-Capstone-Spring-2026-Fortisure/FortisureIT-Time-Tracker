import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
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

            <Header title="Bugs & Feature Requests" showBack />

            <div className="divider" />

            <div className="bug-page">
                <div className="bug-container">

                    <h2>Submit Request</h2>

                    <div className="form-grid">

                        <div className="form-row">
                            <label>Title</label>
                            <input
                                value={form.title}
                                onChange={e => update("title", e.target.value)}
                            />
                        </div>

                        <div className="form-row">
                            <label>Severity</label>
                            <select
                                value={form.severity}
                                onChange={e => update("severity", e.target.value)}
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
                                onChange={e => update("description", e.target.value)}
                            />
                        </div>

                    </div>

                    <div className="modal-buttons">
                        <button className="btn-primary" onClick={handleSubmit}>
                            Submit
                        </button>
                        <button className="btn-secondary" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
export default BugFeatureRequest;