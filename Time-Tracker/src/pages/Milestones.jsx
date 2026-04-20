import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DeleteModal from "../components/DeleteModal";
import Header from "../components/Header";
import ResultModal from "../components/ResultModal";
import MilestoneModal from "./shared/MilestoneModal";
import Button from "../components/Button";

import {
  getMilestones,
  softDeleteMilestone,
  createMilestone,
  updateMilestone,
} from "../services/api";

import "../css/milestones.css";
import { sanitizeNumber } from "./shared/helpers";
import { useRole } from "../context/RoleContext";

const formatDate = (value) => {
  if (!value) return "";
  return value.split("T")[0];
};

const getMilestoneStatus = (milestone) => {
  const normalizedStatus = String(milestone.status || "").toLowerCase().trim();

  if (["submitted", "approved", "rejected", "completed", "complete", "open"].includes(normalizedStatus)) {
    return normalizedStatus === "complete" ? "completed" : normalizedStatus;
  }

  if (milestone.is_completed) {
    return "completed";
  }

  if (milestone.is_submitted || milestone.submitted_at) {
    return "submitted";
  }

  return "open";
};

function Milestones() {
  const { contractId } = useParams();
  const { role, canAccessFeature, currentUserId, loadingUsers } = useRole();

  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugError, setDebugError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState(null);

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);

  const [form, setForm] = useState({
    milestone_name: "",
    description: "",
    due_date: "",
    amount: "",
  });

  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const canEditMilestones = role === "Employee" || role === "Contractor";

  useEffect(() => {
    if (loadingUsers) {
      return;
    }

    if (!canAccessFeature(role, "contracts") || !currentUserId) {
      setLoading(false);
      return;
    }

    loadMilestones();
  }, [contractId, currentUserId, loadingUsers, role]);

  const loadMilestones = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMilestones({
        contract_id: contractId,
        viewer_role: role,
        viewer_user_id: currentUserId,
      });
      const filtered = Array.isArray(data)
        ? data.filter((milestone) => milestone.is_deleted !== true)
        : [];

      setMilestones(filtered);
    } catch (err) {
      console.error("Failed to load milestones:", err);
      setError("Unable to load milestones. Please try again.");
      setDebugError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    if (field === "amount") {
      value = sanitizeNumber(value);
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    setEditingMilestone(null);
    setForm({ milestone_name: "", description: "", due_date: "", amount: "" });
    setShowMilestoneModal(true);
  };

  const handleEdit = (milestone) => {
    setEditingMilestone(milestone);
    setForm({
      milestone_name: milestone.milestone_name || "",
      description: milestone.description || "",
      due_date: milestone.due_date ? milestone.due_date.split("T")[0] : "",
      amount: milestone.amount || "",
    });
    setShowMilestoneModal(true);
  };

  const handleSubmit = async () => {
    setIsSavingMilestone(true);

    try {
      const payload = {
        contract_id: Number(contractId),
        milestone_name: form.milestone_name,
        description: form.description,
        due_date: form.due_date,
        amount: sanitizeNumber(form.amount),
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
      setShowResult(true);
    } catch (err) {
      console.error("Failed to save milestone:", err);
      setResultMessage("Unable to save milestone. Please try again.");
      setShowResult(true);
    } finally {
      setIsSavingMilestone(false);
    }
  };

  const handleDelete = (milestone) => {
    setMilestoneToDelete(milestone);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await softDeleteMilestone(milestoneToDelete.id);
      await loadMilestones();
      setShowDeleteModal(false);
      setResultMessage("Milestone deleted.");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to delete milestone:", err);
      setError("Unable to delete milestone. Please try again.");
      setDebugError(String(err?.message || err));
    }
  };

  if (!canAccessFeature(role, "contracts")) {
    return <div>You are not authorized to view this page.</div>;
  }

  if (error) {
    return (
      <div className="milestones-page">
        <Header title="Milestones" showBack />
        <div className="divider" />

        <div className="error-box">
          <p>{error}</p>
          {debugError && <pre className="debug-error">{debugError}</pre>}
          <button onClick={loadMilestones}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="milestones-page">
      <Header title="Milestones" showBack />
      <div className="divider" />

      {(loading || loadingUsers) && <p>Loading milestones...</p>}

      {!loading && (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {milestones.length === 0 ? (
                  <tr>
                    <td colSpan="6">No milestones found.</td>
                  </tr>
                ) : (
                  milestones.map((milestone) => {
                    const status = getMilestoneStatus(milestone);
                    const canEdit = canEditMilestones && ["open", "draft", "rejected"].includes(status);

                    return (
                      <tr key={milestone.id}>
                        <td>{milestone.milestone_name}</td>
                        <td>{milestone.amount}</td>
                        <td>{formatDate(milestone.due_date)}</td>
                        <td style={{ textTransform: "capitalize" }}>{status}</td>
                        <td>{milestone.description}</td>
                        <td className="icon-cell">
                          {canEdit ? (
                            <>
                              <Button variant="primary" pop onClick={() => handleEdit(milestone)}>
                                Edit
                              </Button>
                              <Button variant="danger" pop onClick={() => handleDelete(milestone)}>
                                Delete
                              </Button>
                            </>
                          ) : (
                            <Button variant="secondary" pop onClick={() => handleEdit(milestone)}>
                              View
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {canEditMilestones ? (
            <div className="add-button-container">
              <button className="add-button" onClick={handleAdd}>
                Add
              </button>
            </div>
          ) : null}
        </>
      )}

      {showMilestoneModal ? (
        <MilestoneModal
          form={form}
          onChange={updateField}
          onSave={handleSubmit}
          onCancel={() => setShowMilestoneModal(false)}
          isEditing={!!editingMilestone}
          isSaving={isSavingMilestone}
        />
      ) : null}

      {showDeleteModal ? (
        <DeleteModal
          isOpen={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      ) : null}

      <ResultModal
        message={resultMessage}
        onClose={() => {
          setShowResult(false);
          setResultMessage("");
        }}
      />
    </div>
  );
}

export default Milestones;


