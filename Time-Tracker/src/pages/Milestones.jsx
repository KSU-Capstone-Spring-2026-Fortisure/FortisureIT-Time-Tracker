import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import DeleteModal from "../components/DeleteModal";
import Header from "../components/Header";
import ResultModal from "../components/ResultModal";
import ConfirmModal from "../components/ConfirmModal";
import MilestoneModal from "./shared/MilestoneModal";
import Button from "../components/Button";

import {
  getMilestones,
  getContracts,
  softDeleteMilestone,
  createMilestone,
  updateMilestone,
  reviewMilestone,
} from "../services/api";

import "../css/milestones.css";
import { sanitizeNumber } from "./shared/helpers";
import { useRole } from "../context/RoleContext";

const SORT_ICONS = {
  asc: "\u2191",
  desc: "\u2193",
  idle: "\u2195",
};

const formatDate = (value) => {
  if (!value) return "";
  return value.split("T")[0];
};

const getMilestoneStatus = (milestone) => {
  const normalizedStatus = String(milestone.status || "").toLowerCase().trim();

  if (["submitted", "approved", "rejected", "completed", "complete", "open", "draft"].includes(normalizedStatus)) {
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

const getContractStatus = (contract) => String(contract?.status || contract?.contract_status || "draft").toLowerCase();

function Milestones() {
  const { clientId, contractId } = useParams();
  const { role, canAccessFeature, currentUserId, loadingUsers, isManagerLike } = useRole();

  const [milestones, setMilestones] = useState([]);
  const [currentContract, setCurrentContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugError, setDebugError] = useState("");
  const [formError, setFormError] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "due_date", direction: "asc" });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState(null);

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [milestoneToReview, setMilestoneToReview] = useState(null);
  const [reviewAction, setReviewAction] = useState("approved");
  const [reviewNote, setReviewNote] = useState("");
  const [isReviewingMilestone, setIsReviewingMilestone] = useState(false);

  const [form, setForm] = useState({
    milestone_name: "",
    description: "",
    due_date: "",
    amount: "",
  });

  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const contractStatus = getContractStatus(currentContract);
  const isContractLocked = ["submitted", "approved"].includes(contractStatus);
  const canEditOwnMilestones = (role === "Employee" || role === "Contractor") && String(currentContract?.created_by) === String(currentUserId);
  const canReviewMilestones = isManagerLike(role) && contractStatus === "submitted";
  const totalMilestoneValue = useMemo(
    () => milestones.reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0),
    [milestones]
  );

  const sortedMilestones = useMemo(() => {
    const getSortValue = (milestone) => {
      switch (sortConfig.key) {
        case "milestone_name":
          return String(milestone.milestone_name || "").toLowerCase();
        case "amount":
          return Number(milestone.amount || 0);
        case "due_date":
          return new Date(milestone.due_date || 0).getTime();
        case "status":
          return getMilestoneStatus(milestone);
        case "description":
        default:
          return String(milestone[sortConfig.key] || "").toLowerCase();
      }
    };

    const sorted = [...milestones];
    sorted.sort((left, right) => {
      const leftValue = getSortValue(left);
      const rightValue = getSortValue(right);
      const comparison = typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [milestones, sortConfig]);

  const toggleSort = (key) => {
    setSortConfig((current) => (
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    ));
  };

  const renderSortableHeader = (label, key) => (
    <button type="button" className="sort-header-button" onClick={() => toggleSort(key)}>
      <span>{label}</span>
      <span className="sort-header-icon">
        {sortConfig.key === key ? (sortConfig.direction === "asc" ? SORT_ICONS.asc : SORT_ICONS.desc) : SORT_ICONS.idle}
      </span>
    </button>
  );

  useEffect(() => {
    if (loadingUsers) {
      return;
    }

    if (!canAccessFeature(role, "contracts") || !currentUserId) {
      setLoading(false);
      return;
    }

    loadMilestones();
  }, [clientId, contractId, currentUserId, loadingUsers, role]);

  const loadMilestones = async () => {
    setLoading(true);
    setError("");

    try {
      const [milestonesData, contractsData] = await Promise.all([
        getMilestones({
          contract_id: contractId,
          viewer_role: role,
          viewer_user_id: currentUserId,
        }),
        getContracts({
          client_id: clientId,
          viewer_role: role,
          viewer_user_id: currentUserId,
        }),
      ]);

      const filteredMilestones = Array.isArray(milestonesData)
        ? milestonesData.filter((milestone) => milestone.is_deleted !== true)
        : [];
      const safeContracts = Array.isArray(contractsData) ? contractsData : [];
      const contract = safeContracts.find((item) => String(item.id) === String(contractId)) || null;

      setMilestones(filteredMilestones);
      setCurrentContract(contract || (filteredMilestones[0] ? {
        id: Number(contractId),
        created_by: filteredMilestones[0].created_by,
        status: filteredMilestones[0].contract_status,
        total_value: filteredMilestones[0].contract_total_value,
      } : null));
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
    setFormError("");
  };

  const handleAdd = () => {
    setEditingMilestone(null);
    setIsViewMode(false);
    setFormError("");
    setForm({ milestone_name: "", description: "", due_date: "", amount: "" });
    setShowMilestoneModal(true);
  };

  const handleEdit = (milestone, viewOnly = false) => {
    setEditingMilestone(milestone);
    setIsViewMode(viewOnly);
    setFormError("");
    setForm({
      milestone_name: milestone.milestone_name || "",
      description: milestone.description || "",
      due_date: milestone.due_date ? milestone.due_date.split("T")[0] : "",
      amount: milestone.amount || "",
    });
    setShowMilestoneModal(true);
  };

  const handleSubmit = async () => {
    const contractLimit = Number(currentContract?.total_value || 0);
    const proposedAmount = Number(form.amount || 0);
    const existingTotal = milestones
      .filter((milestone) => !editingMilestone || String(milestone.id) !== String(editingMilestone.id))
      .reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0);

    if (existingTotal + proposedAmount > contractLimit) {
      setFormError("Milestone totals cannot be greater than the contract total value.");
      return;
    }

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
      setFormError(String(err?.message || "Unable to save milestone. Please try again."));
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

  const openReviewModal = (milestone, action) => {
    setMilestoneToReview(milestone);
    setReviewAction(action);
    setReviewNote(action === "rejected" ? milestone?.rejection_note || "" : "");
    setShowReviewModal(true);
  };

  const handleReview = async () => {
    if (reviewAction === "rejected" && !reviewNote.trim()) {
      setError("A rejection note is required when rejecting a milestone.");
      return;
    }

    setIsReviewingMilestone(true);

    try {
      await reviewMilestone(milestoneToReview.id, {
        status: reviewAction,
        reviewer_id: currentUserId,
        rejection_note: reviewAction === "rejected" ? reviewNote.trim() : null,
      });

      await loadMilestones();
      setShowReviewModal(false);
      setMilestoneToReview(null);
      setReviewNote("");
      setResultMessage(reviewAction === "approved" ? "Milestone approved." : "Milestone rejected.");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to review milestone:", err);
      setError("Unable to review the selected milestone.");
      setDebugError(String(err?.message || err));
    } finally {
      setIsReviewingMilestone(false);
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
          {debugError ? <pre className="debug-error">{debugError}</pre> : null}
          <button onClick={loadMilestones}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="milestones-page">
      <Header title="Milestones" showBack />
      <div className="divider" />

      {(loading || loadingUsers) ? <p>Loading milestones...</p> : null}

      {!loading && !loadingUsers ? (
        <>
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <strong>Contract Status: </strong>
              <span style={{ textTransform: "capitalize" }}>{contractStatus || "draft"}</span>
            </div>
            <div style={{ fontWeight: 600 }}>Total milestone value: ${totalMilestoneValue.toFixed(2)}</div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{renderSortableHeader("Milestone", "milestone_name")}</th>
                  <th>{renderSortableHeader("Amount", "amount")}</th>
                  <th>{renderSortableHeader("Due Date", "due_date")}</th>
                  <th>{renderSortableHeader("Status", "status")}</th>
                  <th>{renderSortableHeader("Description", "description")}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedMilestones.length === 0 ? (
                  <tr>
                    <td colSpan="6">No milestones found.</td>
                  </tr>
                ) : (
                  sortedMilestones.map((milestone) => {
                    const status = getMilestoneStatus(milestone);
                    const canEdit = canEditOwnMilestones && !isContractLocked && ["open", "draft", "rejected"].includes(status);

                    return (
                      <tr key={milestone.id}>
                        <td>{milestone.milestone_name}</td>
                        <td>${Number(milestone.amount || 0).toFixed(2)}</td>
                        <td>{formatDate(milestone.due_date)}</td>
                        <td style={{ textTransform: "capitalize" }}>{status}</td>
                        <td>{milestone.description}</td>
                        <td className="icon-cell">
                          {canEdit ? (
                            <>
                              <Button variant="primary" pop onClick={() => handleEdit(milestone, false)}>
                                Edit
                              </Button>
                              <Button variant="danger" pop onClick={() => handleDelete(milestone)}>
                                Delete
                              </Button>
                            </>
                          ) : (
                            <Button variant="secondary" pop onClick={() => handleEdit(milestone, true)}>
                              View
                            </Button>
                          )}

                          {canReviewMilestones ? (
                            <>
                              {status !== "approved" ? (
                                <Button variant="primary" pop onClick={() => openReviewModal(milestone, "approved")}>
                                  Approve
                                </Button>
                              ) : null}
                              {status !== "rejected" ? (
                                <Button variant="danger" pop onClick={() => openReviewModal(milestone, "rejected")}>
                                  Reject
                                </Button>
                              ) : null}
                            </>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {canEditOwnMilestones && !isContractLocked ? (
            <div className="add-button-container">
              <button className="add-button" onClick={handleAdd}>
                Add
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {showMilestoneModal ? (
        <MilestoneModal
          form={form}
          onChange={updateField}
          onSave={handleSubmit}
          onCancel={() => setShowMilestoneModal(false)}
          isEditing={!!editingMilestone}
          isSaving={isSavingMilestone}
          isViewMode={isViewMode}
          errorMessage={formError}
        />
      ) : null}

      {showDeleteModal ? (
        <DeleteModal isOpen={showDeleteModal} onConfirm={confirmDelete} onCancel={() => setShowDeleteModal(false)} />
      ) : null}

      {showReviewModal ? (
        <ConfirmModal
          message={reviewAction === "approved" ? "Approve this milestone?" : "Reject this milestone?"}
          onCancel={() => {
            setShowReviewModal(false);
            setReviewNote("");
          }}
          onConfirm={handleReview}
          confirmLabel={reviewAction === "approved" ? "Approve" : "Reject"}
          confirmVariant={reviewAction === "approved" ? "primary" : "danger"}
          isLoading={isReviewingMilestone}
          loadingMessage={isReviewingMilestone ? (reviewAction === "approved" ? "Approving milestone..." : "Rejecting milestone...") : ""}
        >
          {reviewAction === "rejected" ? (
            <div style={{ marginTop: "12px" }}>
              <label style={{ display: "block", marginBottom: "6px" }}>Rejection note</label>
              <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={4} style={{ width: "100%" }} />
            </div>
          ) : null}
        </ConfirmModal>
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


