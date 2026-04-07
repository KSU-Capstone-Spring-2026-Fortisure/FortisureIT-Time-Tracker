import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import ResultModal from "../components/ResultModal";
import ConfirmModal from "../components/ConfirmModal";
import BugFeatureModal from "./shared/BugFeatureModal";

import {
  getBugs,
  createBug,
  updateBug,
  completeBug,
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

  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToComplete, setItemToComplete] = useState(null);

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

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // -----------------------------
  // ADD / EDIT
  // -----------------------------

  const handleAdd = () => {
    setEditingItem(null);
    setForm({ title: "", severity: "Low", description: "" });
    setShowEditModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      severity: item.severity,
      description: item.description,
    });
    setShowEditModal(true);
  };

  // -----------------------------
  // MARK COMPLETE
  // -----------------------------

  const openCompleteModal = (item) => {
    setItemToComplete(item);
    setShowConfirmModal(true);
  };

  const handleMarkComplete = async () => {
    try {
      await completeBug(itemToComplete.id);

      await loadBugs();
      setShowConfirmModal(false);
      setItemToComplete(null);
      setResultMessage("Request marked as complete.");
    } catch (err) {
      console.error("Failed to mark complete:", err);
      setError("Unable to update request.");
    }
  };

  // -----------------------------
  // SAVE
  // -----------------------------

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await updateBug(editingItem.id, form);
      } else {
        await createBug(form);
      }

      await loadBugs();
      setShowEditModal(false);
      setEditingItem(null);
      setResultMessage("Request saved successfully.");
    } catch (err) {
      console.error("Failed to submit request:", err);
      setError("Unable to submit request. Please try again.");
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------

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
                        <span className="icon" onClick={() => handleEdit(i)}>✏️</span>
                        <span className="icon" onClick={() => openCompleteModal(i)}>✅</span>
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
            </>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <BugFeatureModal
          form={form}
          onChange={updateField}
          onSave={handleSubmit}
          onCancel={() => setShowEditModal(false)}
          isEditing={!!editingItem}
        />
      )}

      {/* CONFIRM COMPLETE MODAL */}
      {showConfirmModal && (
        <ConfirmModal
          message="Are you sure you want to mark this as complete?"
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handleMarkComplete}
        />
      )}

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