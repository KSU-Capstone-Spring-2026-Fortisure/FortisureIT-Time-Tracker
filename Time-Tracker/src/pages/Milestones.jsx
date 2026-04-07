import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DeleteModal from "../components/DeleteModal";
import Header from "../components/Header";
import ResultModal from "../components/ResultModal";
import MilestoneModal from "./shared/MilestoneModal";

import {
  getMilestones,
  softDeleteMilestone,
  createMilestone,
  updateMilestone,
} from "../services/api";

import "../css/milestones.css";

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
};

function Milestones() {
  const navigate = useNavigate();
  const { clientId, contractId } = useParams();

  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState(null);

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);

  const [form, setForm] = useState({
    milestone_name: "",
    description: "",
    due_date: "",
    amount: "",
  });

  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMilestones();
      const filtered = data.filter(
        (m) =>
          String(m.contract_id) === String(contractId) &&
          m.is_deleted !== true
      );
      setMilestones(filtered);
    } catch (err) {
      console.error("Failed to load milestones:", err);
      setError("Unable to load milestones. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    setEditingMilestone(null);
    setForm({
      milestone_name: "",
      description: "",
      due_date: "",
      amount: "",
    });
    setShowMilestoneModal(true);
  };

  const handleEdit = (m) => {
    setEditingMilestone(m);
    setForm({
      milestone_name: m.milestone_name || "",
      description: m.description || "",
      due_date: m.due_date ? m.due_date.split("T")[0] : "",
      amount: m.amount || "",
    });
    setShowMilestoneModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        contract_id: Number(contractId),
        milestone_name: form.milestone_name,
        description: form.description,
        due_date: form.due_date,
        amount: form.amount,
      };

      if (editingMilestone) {
        await updateMilestone(editingMilestone.id, payload);
      } else {
        await createMilestone(payload);
      }

      await loadMilestones();
      setShowMilestoneModal(false);
      setEditingMilestone(null);
      setResultMessage("Milestone saved.");
    } catch (err) {
      console.error("Failed to save milestone:", err);
      setResultMessage("Unable to save milestone. Please try again.");
    }
  };

  const handleDelete = (m) => {
    setMilestoneToDelete(m);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await softDeleteMilestone(milestoneToDelete.id);
      await loadMilestones();
      setResultMessage("Milestone deleted.");
    } catch (err) {
      console.error("Failed to delete milestone:", err);
      setError("Unable to delete milestone. Please try again.");
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (error) {
    return (
      <div className="milestones-page">
        <Header title="Milestones" showBack />
        <div className="divider" />

        <div className="error-box">
          <p>{error}</p>
          <button onClick={loadMilestones}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="milestones-page">
      <Header title="Milestones" showBack />

      <div className="divider" />

      {loading && <p>Loading milestones...</p>}

      {!loading && (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.id}>
                    <td>{m.milestone_name}</td>
                    <td>{m.amount}</td>
                    <td>{formatDate(m.due_date)}</td>
                    <td>{m.description}</td>
                    <td className="icon-cell">
                      <span className="icon" onClick={() => handleEdit(m)}>
                        ✏️
                      </span>
                      <span className="icon" onClick={() => handleDelete(m)}>
                        ❌
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="add-button-container">
            <button className="add-button" onClick={handleAdd}>
              Add
            </button>
          </div>
        </>
      )}

      {showMilestoneModal && (
        <MilestoneModal
          form={form}
          onChange={updateField}
          onSave={handleSubmit}
          onCancel={() => setShowMilestoneModal(false)}
          isEditing={!!editingMilestone}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <ResultModal
        message={resultMessage}
        onClose={() => {
          setResultMessage("");
          navigate(`/contracts/${clientId}`);
        }}
      />
    </div>
  );
}

export default Milestones;