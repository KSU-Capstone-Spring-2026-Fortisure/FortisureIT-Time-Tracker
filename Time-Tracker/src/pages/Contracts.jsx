import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import DeleteModal from "../components/DeleteModal";
import ConfirmModal from "../components/ConfirmModal";
import ResultModal from "../components/ResultModal";
import AddEditContractModal from "./shared/AddEditContractModal";
import Button from "../components/Button";

import {
  getContracts,
  createContract,
  updateContract,
  softDeleteContract,
  submitContract,
  reviewContract,
} from "../services/api";
import { sanitizeNumber } from "./shared/helpers";
import { useRole } from "../context/RoleContext";
import "../css/contracts.css";

const CONTRIBUTOR_ROLES = ["Employee", "Contractor"];
const PAGE_SIZE = 15;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toDateInputValue = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateOnly = (value) => {
  const [year, month, day] = String(value).split("T")[0].split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0, 0);
};

const getWeekStart = (value) => {
  const date = parseDateOnly(value);
  date.setDate(date.getDate() - date.getDay());
  return date;
};

const addDays = (date, days) => new Date(date.getTime() + days * DAY_IN_MS);

const formatWeekLabel = (start, end) => {
  const options = { month: "long", day: "numeric" };
  const startLabel = start.toLocaleDateString("en-US", options);
  const endLabel = end.toLocaleDateString("en-US", options);
  return `${startLabel} - ${endLabel}`;
};

const formatDate = (value) => {
  if (!value) return "";
  return value.split("T")[0];
};

const getContractStatus = (contract) => (contract.status || "draft").toLowerCase();

const getSortTime = (record) => {
  const value = record.updated_at || record.created_at || record.start_date;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

function Contracts() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { role, canAccessFeature, isManagerLike, getTemporaryUserId } = useRole();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugError, setDebugError] = useState("");

  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [contractToReview, setContractToReview] = useState(null);
  const [reviewAction, setReviewAction] = useState("approved");
  const [reviewNote, setReviewNote] = useState("");

  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));
  const [currentPage, setCurrentPage] = useState(1);

  const [isSubmittingContracts, setIsSubmittingContracts] = useState(false);
  const [isReviewingContract, setIsReviewingContract] = useState(false);
  const [confirmProgressMessage, setConfirmProgressMessage] = useState("");

  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekLabel = useMemo(() => formatWeekLabel(weekStart, weekEnd), [weekEnd, weekStart]);
  const currentUserId = getTemporaryUserId(role);
  const selectedDay = useMemo(() => parseDateOnly(selectedDate), [selectedDate]);

  const canContribute = CONTRIBUTOR_ROLES.includes(role);
  const canReview = isManagerLike(role);

  useEffect(() => {
    if (!canAccessFeature(role, "contracts")) {
      setLoading(false);
      return;
    }

    loadData();
  }, [clientId, role, selectedDate]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const contractsData = await getContracts({
        client_id: clientId,
        viewer_role: role,
        viewer_user_id: currentUserId,
      });

      const safeContracts = Array.isArray(contractsData) ? contractsData : [];
      const filteredContracts = safeContracts
        .filter((contract) => String(contract.client_id) === String(clientId))
        .filter((contract) => {
          const startDate = parseDateOnly(contract.start_date);
          const endDate = parseDateOnly(contract.end_date || contract.start_date);
          return selectedDay >= startDate && selectedDay <= endDate;
        })
        .filter((contract) => {
          if (role === "Admin") return true;
          if (role === "Manager") return contract.created_by != null;
          return String(contract.created_by) === String(currentUserId);
        })
        .sort((left, right) => getSortTime(right) - getSortTime(left) || Number(right.id || 0) - Number(left.id || 0));

      setContracts(filteredContracts);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load contracts:", err);
      setError("Unable to load contracts. Please try again later.");
      setDebugError(String(err?.message || err));
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingContract(null);
    setIsViewMode(false);
    setShowAddEdit(true);
  };

  const handleView = (contract) => {
    setEditingContract(contract);
    setIsViewMode(true);
    setShowAddEdit(true);
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setIsViewMode(false);
    setShowAddEdit(true);
  };

  const isEditableContract = (contract) => {
    const status = getContractStatus(contract);
    return canContribute && String(contract.created_by) === String(currentUserId) && ["draft", "rejected"].includes(status);
  };

  const submittableContracts = contracts.filter(isEditableContract);
  const pendingReviewContracts = contracts.filter((contract) => getContractStatus(contract) === "submitted");

  const totalPages = Math.max(1, Math.ceil(contracts.length / PAGE_SIZE));
  const paginatedContracts = contracts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageWindow = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) => page >= currentPage - 2 && page <= currentPage + 2
  );

  const handleSave = async (data) => {
    try {
      const payload = {
        client_id: Number(clientId),
        contract_name: data.contract_name,
        description: data.description,
        total_value: sanitizeNumber(data.total_value),
        start_date: data.start_date,
        end_date: data.end_date,
        created_by: currentUserId,
      };

      if (editingContract && editingContract.id) {
        await updateContract(editingContract.id, payload);
      } else {
        await createContract(payload);
      }

      await loadData();
      setShowAddEdit(false);
      setResultMessage("Contract saved successfully.");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to save contract:", err);
      setError("Unable to save contract. Please try again later.");
      setDebugError(String(err?.message || err));
    }
  };

  const handleDelete = (contract) => {
    setContractToDelete(contract);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await softDeleteContract(contractToDelete.id);
      await loadData();
      setShowDeleteModal(false);
      setResultMessage("Contract deleted.");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to delete contract:", err);
      setError("Unable to delete contract. Please try again later.");
      setDebugError(String(err?.message || err));
    }
  };

  const handleSubmitContracts = async () => {
    setIsSubmittingContracts(true);

    try {
      for (const [index, contract] of submittableContracts.entries()) {
        setConfirmProgressMessage(`Submitting contract ${index + 1} of ${submittableContracts.length}...`);
        await submitContract(contract.id, { submitted_by: currentUserId });
      }

      await loadData();
      setShowSubmitConfirm(false);
      setConfirmProgressMessage("");
      setResultMessage("Contracts submitted.");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to submit contracts:", err);
      setError("Unable to submit contracts.");
      setDebugError(String(err?.message || err));
    } finally {
      setIsSubmittingContracts(false);
    }
  };

  const openReviewModal = (contract, action) => {
    setContractToReview(contract);
    setReviewAction(action);
    setReviewNote(contract.rejection_note || "");
    setConfirmProgressMessage("");
    setShowReviewModal(true);
  };

  const handleReview = async () => {
    if (reviewAction === "rejected" && !reviewNote.trim()) {
      setError("A rejection note is required when rejecting a contract.");
      return;
    }

    setIsReviewingContract(true);
    setConfirmProgressMessage(reviewAction === "approved" ? "Approving contract..." : "Rejecting contract...");

    try {
      await reviewContract(contractToReview.id, {
        status: reviewAction,
        reviewer_id: currentUserId,
        rejection_note: reviewAction === "rejected" ? reviewNote.trim() : null,
      });

      await loadData();
      setShowReviewModal(false);
      setContractToReview(null);
      setReviewNote("");
      setConfirmProgressMessage("");
      setResultMessage(reviewAction === "approved" ? "Contract approved." : "Contract rejected and returned to the employee.");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to review contract:", err);
      setError("Unable to review the selected contract.");
      setDebugError(String(err?.message || err));
    } finally {
      setIsReviewingContract(false);
    }
  };

  if (!canAccessFeature(role, "contracts")) {
    return <div>You are not authorized to view this page.</div>;
  }

  return (
    <div className="contracts-page">
      <Header title="Contracts" showBack />
      <div className="divider" />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={() => setSelectedDate(toDateInputValue(addDays(weekStart, -7)))}>
            {"<"}
          </Button>
          <div>
            <strong>Week of {weekLabel}</strong>
            <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>Showing contracts where the selected day falls between start and end.</div>
          </div>
          <Button variant="secondary" onClick={() => setSelectedDate(toDateInputValue(addDays(weekStart, 7)))}>
            {">"}
          </Button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <label htmlFor="contracts-week-picker">Jump to week</label>
          <input
            id="contracts-week-picker"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="error-box">
          <p>{error}</p>
          {debugError ? <pre className="debug-error">{debugError}</pre> : null}
          <button onClick={loadData}>Retry</button>
        </div>
      ) : null}

      {loading ? <p>Loading contracts...</p> : null}

      {!loading && !error ? (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {canReview ? <th>Employee</th> : null}
                  <th>Contract Name</th>
                  <th>Total Value</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Rejection Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedContracts.length === 0 ? (
                  <tr>
                    <td colSpan={canReview ? "8" : "7"}>No contracts found for this week.</td>
                  </tr>
                ) : (
                  paginatedContracts.map((contract) => {
                    const status = getContractStatus(contract);
                    const canEdit = isEditableContract(contract);

                    return (
                      <tr key={contract.id}>
                        {canReview ? <td>{contract.created_by_name || `User ${contract.created_by}`}</td> : null}
                        <td>{contract.contract_name}</td>
                        <td>{contract.total_value}</td>
                        <td>{formatDate(contract.start_date)}</td>
                        <td>{formatDate(contract.end_date)}</td>
                        <td style={{ textTransform: "capitalize" }}>{status}</td>
                        <td>{contract.rejection_note || "-"}</td>
                        <td className="icon-cell">
                          <Button variant="secondary" onClick={() => handleView(contract)}>
                            View
                          </Button>
                          {canEdit ? (
                            <>
                              <Button variant="primary" onClick={() => handleEdit(contract)}>
                                Edit
                              </Button>
                              <Button variant="danger" onClick={() => handleDelete(contract)}>
                                Delete
                              </Button>
                            </>
                          ) : null}
                          {canReview && status === "submitted" ? (
                            <>
                              <Button variant="complete" onClick={() => openReviewModal(contract, "approved")}>
                                Approve
                              </Button>
                              <Button variant="danger" onClick={() => openReviewModal(contract, "rejected")}>
                                Reject
                              </Button>
                            </>
                          ) : null}
                          <Button variant="secondary" onClick={() => navigate(`/contracts/${clientId}/milestones/${contract.id}`)}>
                            Milestones
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="pagination">
              <Button variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                {"<<"}
              </Button>
              <Button variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                {"<"}
              </Button>
              {pageWindow.map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "primary" : "secondary"}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                {">"}
              </Button>
              <Button variant="secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
                {">>"}
              </Button>
            </div>
          ) : null}

          {canContribute ? (
            <div className="add-container" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Button variant="primary" pop onClick={handleAdd}>
                Add
              </Button>
              {submittableContracts.length > 0 ? (
                <Button variant="primary" pop onClick={() => setShowSubmitConfirm(true)}>
                  Submit Week
                </Button>
              ) : null}
            </div>
          ) : null}

          {canReview && pendingReviewContracts.length > 0 ? (
            <div style={{ marginTop: "16px", color: "#374151" }}>
              {pendingReviewContracts.length} submitted contract{pendingReviewContracts.length === 1 ? "" : "s"} waiting for review.
            </div>
          ) : null}
        </>
      ) : null}

      {showAddEdit ? (
        <AddEditContractModal
          isOpen={showAddEdit}
          record={editingContract}
          isViewMode={isViewMode}
          onSave={handleSave}
          onClose={() => setShowAddEdit(false)}
        />
      ) : null}

      {showDeleteModal ? (
        <DeleteModal
          isOpen={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      ) : null}

      {showSubmitConfirm ? (
        <ConfirmModal
          message="Submit all draft and rejected contracts in this week for review?"
          onConfirm={handleSubmitContracts}
          onCancel={() => {
            if (!isSubmittingContracts) {
              setShowSubmitConfirm(false);
              setConfirmProgressMessage("");
            }
          }}
          confirmLabel={isSubmittingContracts ? "Submitting..." : "Submit"}
          isLoading={isSubmittingContracts}
          loadingMessage={confirmProgressMessage}
        />
      ) : null}

      {showReviewModal ? (
        <ConfirmModal
          message={reviewAction === "approved" ? "Approve this contract?" : "Reject this contract and return it to the employee?"}
          onConfirm={handleReview}
          onCancel={() => {
            if (!isReviewingContract) {
              setShowReviewModal(false);
              setConfirmProgressMessage("");
            }
          }}
          confirmLabel={
            isReviewingContract
              ? reviewAction === "approved"
                ? "Approving..."
                : "Rejecting..."
              : reviewAction === "approved"
                ? "Approve"
                : "Reject"
          }
          confirmVariant={reviewAction === "approved" ? "complete" : "danger"}
          isLoading={isReviewingContract}
          loadingMessage={confirmProgressMessage}
        >
          {reviewAction === "rejected" ? (
            <div style={{ marginTop: "12px" }}>
              <label htmlFor="contract-rejection-note" style={{ display: "block", marginBottom: "6px" }}>
                Rejection note
              </label>
              <textarea
                id="contract-rejection-note"
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                rows={4}
                style={{ width: "100%" }}
                disabled={isReviewingContract}
              />
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

export default Contracts;
