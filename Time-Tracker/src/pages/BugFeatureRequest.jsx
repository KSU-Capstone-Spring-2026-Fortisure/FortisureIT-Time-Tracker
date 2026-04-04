import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ResultModal from "../components/ResultModal";
import { getBugs, createBug } from "../services/api";
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
      setItems(data);
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

  const handleSubmit = async () => {
    try {
      const created = await createBug(form);
      setItems((prev) => [...prev, created]);
      setForm({ title: "", severity: "Low", description: "" });
      setShowForm(false);
      setResultMessage("Request submitted.");
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
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>{i.title}</td>
                      <td>{i.severity}</td>
                      <td>{i.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="add-container">
                <button className="add-btn" onClick={() => setShowForm(true)}>
                  Add
                </button>
              </div>

              {showForm && (
                <>
                  <h3>New Request</h3>
                  <div className="form-grid">
                    <div className="form-row">
                      <label>Title</label>
                      <input
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                      />
                    </div>

                    <div className="form-row">
                      <label>Severity</label>
                      <select
                        value={form.severity}
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
                        onChange={(e) =>
                          update("description", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="modal-buttons">
                    <button className="btn-primary" onClick={handleSubmit}>
                      Submit
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
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
          navigate("/"); // ProjectTracker
        }}
      />
    </div>
  );
}

export default BugFeatureRequest;