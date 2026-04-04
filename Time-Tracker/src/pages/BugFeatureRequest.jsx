import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ResultModal from "../components/ResultModal";
import {
  getBugs,
  createBug,
  updateBug,   // ✅ NEW
} from "../services/api";
import "../css/bugfeaturerequest.css";

function BugFeatureRequest() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: "",
    severity: "Low",
    description: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [resultMessage, setResultMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBugs();
  }, []);

  const loadBugs = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getBugs();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load bugs:", err);
      setError("Unable to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="bug-report">
        <Header title="Bugs & Feature Requests" showBack />
        <div className="divider" />

        <div className="error-box">
          <p>{error}</p>
          <button onClick={loadBugs}>Retry</button>
        </div>
      </div>
    );
  }

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // -----------------------------
  // ADD / EDIT / VIEW HANDLERS
  // -----------------------------

  const handleAdd = () => {
    setEditingItem(null);
    setIsViewMode(false);
    setForm({ title: "", severity: "Low", description: "" });
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsViewMode(false);
    setForm({
      title: item.title,
      severity: item.severity,
      description: item.description,
    });
    setShowForm(true);
  };

  const handleView = (item) => {
    setEditingItem(item);
    setIsViewMode(true);
    setForm({
      title: item.title,
      severity: item.severity,
      description: item.description,
    });
    setShowForm(true);
  };

  // -----------------------------
  // SAVE HANDLER
  // -----------------------------

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        // UPDATE
        await updateBug(editingItem.id, form);
      } else {
        // CREATE
        const created = await createBug(form);
        setItems((prev) => [...prev, created]);
      }

      await loadBugs();
      setShowForm(false);
      setEditingItem(null);
      setResultMessage("Request saved successfully.");
    } catch (err) {
      console.error("Failed to submit request:", err);
      setError("Unable to submit request. Please try again.");
    }
  };

  return (
    <div className="bug-report">
      <Header title="Bugs & Feature Requests" showBack />

      <div className="divider" />

      <div className="bug-page">
        <div className="bug-container">
          <h2>Submitted Requests</h2>

          {loading && <p>Loading requests...</p>}

          {!loading && (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Description</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>{i.title}</td>
                      <td>{i.severity}</td>
                      <td>{i.description}</td>
                      <td className="icon-cell">
                        <span className="icon" onClick={() => handleView(i)}>📄</span>
                        <span className="icon" onClick={() => handleEdit(i)}>✏️</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="add-container">
                <button className="add-btn" onClick={handleAdd}>
                  Add
                </button>
              </div>

              {showForm && (
                <>
                  <h3>{isViewMode ? "View Request" : editingItem ? "Edit Request" : "New Request"}</h3>

                  <div className="form-grid">
                    <div className="form-row">
                      <label>Title</label>
                      <input
                        value={form.title}
                        disabled={isViewMode}
                        onChange={(e) => update("title", e.target.value)}
                      />
                    </div>

                    <div className="form-row">
                      <label>Severity</label>
                      <select
                        value={form.severity}
                        disabled={isViewMode}
                        onChange={(e) => update("severity", e.target.value)}
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
                        disabled={isViewMode}
                        onChange={(e) => update("description", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="modal-buttons">
                    {!isViewMode && (
                      <button className="btn-primary" onClick={handleSubmit}>
                        Save
                      </button>
                    )}
                    <button
                      className="btn-secondary"
                      onClick={() => setShowForm(false)}
                    >
                      {isViewMode ? "Close" : "Cancel"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <ResultModal
        message={resultMessage}
        onClose={() => {
          setResultMessage("");
          navigate("/");
        }}
      />
    </div>
  );
}

export default BugFeatureRequest;