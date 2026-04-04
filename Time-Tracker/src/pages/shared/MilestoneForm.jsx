import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../../css/modals/milestoneForm.css";
import { createMilestone, updateMilestone } from "../../services/api";

function MilestoneForm() {
  const navigate = useNavigate();
  const { clientId, contractId, milestoneId } = useParams();
  const location = useLocation();
  const initialData = location.state?.initialData;

  const [form, setForm] = useState({
    milestone_name: "",
    description: "",
    due_date: "",
    amount: "",
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        milestone_name: initialData.milestone_name || "",
        description: initialData.description || "",
        due_date: initialData.due_date
          ? initialData.due_date.split("T")[0]
          : "",
        amount: initialData.amount || "",
      });
    }
  }, [initialData]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setSaveMessage("");

      const payload = {
        contract_id: Number(contractId),
        milestone_name: form.milestone_name,
        description: form.description,
        due_date: form.due_date,
        amount: form.amount,
      };

      if (milestoneId) {
        await updateMilestone(milestoneId, payload);
      } else {
        await createMilestone(payload);
      }

      setSaveMessage("Milestone saved.");
      navigate(`/contracts/${clientId}/milestones/${contractId}`);
    } catch (err) {
      console.error("Failed to save milestone:", err);
      setSaveMessage("Unable to save milestone. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="milestone-form-page">
      <div className="header-row">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1>{milestoneId ? "Edit Milestone" : "Add Milestone"}</h1>
      </div>

      <div className="divider" />

      <div className="form-container">
        <label>Milestone Name</label>
        <input
          value={form.milestone_name}
          onChange={(e) => update("milestone_name", e.target.value)}
        />

        <label>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />

        <label>Due Date</label>
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => update("due_date", e.target.value)}
        />

        <label>Amount</label>
        <input
          type="number"
          value={form.amount}
          onChange={(e) => update("amount", e.target.value)}
        />

        {saveMessage && <p className="save-message">{saveMessage}</p>}

        <button className="submit-btn" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export default MilestoneForm;