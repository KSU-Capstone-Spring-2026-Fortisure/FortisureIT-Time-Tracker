import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import AddEditModal from "./shared/AddEditTimeModal";
import DeleteModal from "../components/DeleteModal";
import ConfirmModal from "../components/ConfirmModal";
import ResultModal from "../components/ResultModal";
import Header from "../components/Header";
import Button from "../components/Button";

import {
  getHours,
  createHourEntry,
  updateHourEntry,
  softDeleteHour,
  markHourSubmitted,
  reviewHourEntry,
} from "../services/api";

import { sanitizeNumber } from "./shared/helpers";
import { useRole } from "../context/RoleContext";

import "../css/hourlytracking.css";

const CONTRIBUTOR_ROLES = ["Hourly", "Employee"];
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

const getEntryStatus = (entry) => {
  const normalizedStatus = String(entry.status || "").toLowerCase().trim();

  if (["submitted", "approved", "rejected"].includes(normalizedStatus)) {
    return normalizedStatus;
  }

  if (entry.is_submitted || entry.submitted_at) {
    return "submitted";
  }

  return normalizedStatus || "draft";
};

const getSortTime = (record) => {
  const value = record.updated_at || record.created_at || record.work_date;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const getSubmitterLabel = (entry) => entry.user_name || entry.submitted_by_name || `User ${entry.user_id}`;

function HourlyTracking() {
  const { clientId } = useParams();
  const { role, users, currentUserId, managedUserIds, canAccessFeature, isManagerLike, loadingUsers } = useRole();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugError, setDebugError] = useState("");
  const [reviewSort, setReviewSort] = useState("recent");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all");

  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState("approved");
  const [reviewNote, setReviewNote] = useState("");
  const [entryToReview, setEntryToReview] = useState(null);
  const [reviewScope, setReviewScope] = useState("single");

  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));
  const [currentPage, setCurrentPage] = useState(1);

  const [isSubmittingHours, setIsSubmittingHours] = useState(false);
  const [isReviewingHours, setIsReviewingHours] = useState(false);
  const [confirmProgressMessage, setConfirmProgressMessage] = useState("");

  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekLabel = useMemo(() => formatWeekLabel(weekStart, weekEnd), [weekEnd, weekStart]);

  const canContribute = CONTRIBUTOR_ROLES.includes(role);
  const canReview = isManagerLike(role);

  useEffect(() => {
    if (loadingUsers) {
      return;
    }

    if (!canAccessFeature(role, "hourly") || !currentUserId) {
      setLoading(false);
      return;
    }

    loadEntries();
  }, [clientId, currentUserId, loadingUsers, role, selectedDate]);

  const loadEntries = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getHours({
        client_id: clientId,
        viewer_role: role,
        viewer_user_id: currentUserId,
      });

      const safeEntries = Array.isArray(data) ? data : [];
      const visibleUserIds = role === "Admin"
        ? null
        : role === "Manager"
          ? [currentUserId, ...managedUserIds]
          : [currentUserId];

      const filteredEntries = safeEntries
        .filter((entry) => String(entry.client_id) === String(clientId))
        .filter((entry) => {
          const workDate = parseDateOnly(entry.work_date);
          return workDate >= weekStart && workDate <= weekEnd;
        })
        .filter((entry) => {
          if (!visibleUserIds) return true;
          return visibleUserIds.some((userId) => String(userId) === String(entry.user_id));
        });

      setEntries(filteredEntries);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load hours:", err);
      setError("Unable to load hourly entries. Please try again.");
      setDebugError(String(err?.message || err));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedEntries = useMemo(() => {
    const sorted = [...entries];

    sorted.sort((left, right) => {
      if (reviewSort === "employee-asc") {
        return getSubmitterLabel(left).localeCompare(getSubmitterLabel(right)) || getSortTime(right) - getSortTime(left);
      }

      if (reviewSort === "employee-desc") {
        return getSubmitterLabel(right).localeCompare(getSubmitterLabel(left)) || getSortTime(right) - getSortTime(left);
      }

      if (reviewSort === "date-desc") {
        return parseDateOnly(right.work_date) - parseDateOnly(left.work_date) || getSortTime(right) - getSortTime(left);
      }

      return getSortTime(right) - getSortTime(left) || Number(right.id || 0) - Number(left.id || 0);
    });

    return sorted;
  }, [entries, reviewSort]);

  const visibleEmployeeOptions = useMemo(() => {
    const options = new Map();

    sortedEntries.forEach((entry) => {
      if (!entry?.user_id) return;
      options.set(String(entry.user_id), getSubmitterLabel(entry));
    });

    return Array.from(options.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [sortedEntries]);

  useEffect(() => {
    if (selectedEmployeeId === "all") {
      return;
    }

    if (!visibleEmployeeOptions.some((option) => option.value === String(selectedEmployeeId))) {
      setSelectedEmployeeId("all");
    }
  }, [selectedEmployeeId, visibleEmployeeOptions]);

  const displayedEntries = useMemo(() => {
    if (selectedEmployeeId === "all") {
      return sortedEntries;
    }

    return sortedEntries.filter((entry) => String(entry.user_id) === String(selectedEmployeeId));
  }, [selectedEmployeeId, sortedEntries]);

  const handleAdd = () => {
    setEditingEntry(null);
    setIsViewMode(false);
    setShowAddEdit(true);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setIsViewMode(false);
    setShowAddEdit(true);
  };

  const handleView = (entry) => {
    setEditingEntry(entry);
    setIsViewMode(true);
    setShowAddEdit(true);
  };

  const isEditableEntry = (entry) => {
    const status = getEntryStatus(entry);
    return canContribute && String(entry.user_id) === String(currentUserId) && ["draft", "rejected"].includes(status);
  };

  const pendingReviewEntries = displayedEntries.filter((entry) => getEntryStatus(entry) === "submitted");
  const submittableEntries = displayedEntries.filter(isEditableEntry);

  const totalPages = Math.max(1, Math.ceil(displayedEntries.length / PAGE_SIZE));
  const paginatedEntries = displayedEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageWindow = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) => page >= currentPage - 2 && page <= currentPage + 2
  );
  const weeklyTotal = displayedEntries.reduce((sum, entry) => sum + Number(entry.hours_worked || 0), 0);

  const resetReviewModal = () => {
    setShowReviewModal(false);
    setEntryToReview(null);
    setReviewNote("");
    setReviewScope("single");
    setConfirmProgressMessage("");
  };

  const handleSave = async (data) => {
    try {
      const payload = {
        user_id: currentUserId,
        client_id: Number(clientId),
        work_date: data.work_date,
        hours_worked: sanitizeNumber(data.hours_worked),
        notes: data.notes,
        is_billable: data.is_billable,
      };

      if (data.id) {
        await updateHourEntry(data.id, payload);
      } else {
        await createHourEntry(payload);
      }

      await loadEntries();
      setShowAddEdit(false);
      setResultMessage("Hours saved successfully.");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to save entry:", err);
      setError("Unable to save entry. Please try again.");
      setDebugError(String(err?.message || err));
    }
  };

  const handleDelete = (entry) => {
    setEntryToDelete(entry);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await softDeleteHour(entryToDelete.id);
      await loadEntries();
      setShowDeleteModal(false);
      setResultMessage("Entry deleted.");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to delete entry:", err);
      setError("Unable to delete entry. Please try again.");
      setDebugError(String(err?.message || err));
    }
  };

  const handleSubmitHours = async () => {
    setIsSubmittingHours(true);

    try {
      for (const [index, entry] of submittableEntries.entries()) {
        setConfirmProgressMessage(`Submitting entry ${index + 1} of ${submittableEntries.length}...`);
        await markHourSubmitted(entry.id, { submitted_by: currentUserId });
      }

      await loadEntries();
      setShowSubmitConfirm(false);
      setConfirmProgressMessage("");
      setResultMessage("Hours submitted successfully.");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to submit hours:", err);
      setError("Unable to submit hours. Please try again.");
      setDebugError(String(err?.message || err));
    } finally {
      setIsSubmittingHours(false);
    }
  };

  const openReviewModal = (entry, action, scope = "single") => {
    setEntryToReview(entry);
    setReviewScope(scope);
    setReviewAction(action);
    setReviewNote(entry?.rejection_note || "");
    setConfirmProgressMessage("");
    setShowReviewModal(true);
  };

  const handleReview = async () => {
    if (reviewAction === "rejected" && !reviewNote.trim()) {
      setError("A rejection note is required when rejecting hours.");
      return;
    }

    const targets = reviewScope === "all" ? pendingReviewEntries : entryToReview ? [entryToReview] : [];

    if (targets.length === 0) {
      setError("There are no submitted hours to review.");
      return;
    }

    setIsReviewingHours(true);

    try {
      for (const [index, entry] of targets.entries()) {
        const verb = reviewAction === "approved" ? "Approving" : "Rejecting";
        setConfirmProgressMessage(`${verb} entry ${index + 1} of ${targets.length}...`);
        await reviewHourEntry(entry.id, {
          status: reviewAction,
          reviewer_id: currentUserId,
          rejection_note: reviewAction === "rejected" ? reviewNote.trim() : null,
        });
      }

      await loadEntries();
      resetReviewModal();
      setResultMessage(
        reviewAction === "approved"
          ? targets.length === 1
            ? "Hours approved."
            : "All selected hours approved."
          : targets.length === 1
            ? "Hours rejected and returned to the employee."
            : "All selected hours were rejected and returned to the employee."
      );
      setShowResult(true);
    } catch (err) {
      console.error("Failed to review entry:", err);
      setError("Unable to review the selected hours.");
      setDebugError(String(err?.message || err));
    } finally {
      setIsReviewingHours(false);
    }
  };

  if (!canAccessFeature(role, "hourly")) {
    return <div>You are not authorized to view this page.</div>;
  }

  return (
    <div className="timeTracker">
      <Header title="Hourly Tracking" showBack />
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
            <div style={{ fontSize: "0.9rem", color: "#4b5563" }}>Showing entries within the selected week.</div>
          </div>
          <Button variant="secondary" onClick={() => setSelectedDate(toDateInputValue(addDays(weekStart, 7)))}>
            {">"}
          </Button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {canReview ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label htmlFor="hourly-sort">Sort by</label>
                <select id="hourly-sort" value={reviewSort} onChange={(event) => setReviewSort(event.target.value)}>
                  <option value="recent">Most Recent</option>
                  <option value="employee-asc">Employee A-Z</option>
                  <option value="employee-desc">Employee Z-A</option>
                  <option value="date-desc">Date Worked</option>
                </select>
              </div>

              {visibleEmployeeOptions.length > 1 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label htmlFor="hourly-employee-filter">Employee</label>
                  <select
                    id="hourly-employee-filter"
                    value={selectedEmployeeId}
                    onChange={(event) => setSelectedEmployeeId(event.target.value)}
                  >
                    <option value="all">All Employees</option>
                    {visibleEmployeeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <label htmlFor="hourly-week-picker">Jump to week</label>
            <input
              id="hourly-week-picker"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "12px", fontWeight: 600 }}>Weekly total: {weeklyTotal.toFixed(2)} hours</div>

      {error && (
        <div className="error-box">
          <p>{error}</p>
          {debugError ? <pre className="debug-error">{debugError}</pre> : null}
          <button onClick={loadEntries}>Retry</button>
        </div>
      )}

      {(loading || loadingUsers) && <p>Loading hourly entries...</p>}

      {!loading && !loadingUsers && !error && (
        <>
          {canReview && pendingReviewEntries.length > 0 ? (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              <Button variant="complete" onClick={() => openReviewModal(null, "approved", "all")}>
                Approve All
              </Button>
              <Button variant="danger" onClick={() => openReviewModal(null, "rejected", "all")}>
                Reject All
              </Button>
            </div>
          ) : null}

          <table>
            <thead>
              <tr>
                {canReview ? <th>Submitted By</th> : null}
                <th>Date Worked</th>
                <th>Hours</th>
                <th>Billable</th>
                <th>Status</th>
                <th>Rejection Note</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={canReview ? "8" : "7"}>No entries found for this week.</td>
                </tr>
              ) : (
                paginatedEntries.map((entry) => {
                  const status = getEntryStatus(entry);
                  const canEdit = isEditableEntry(entry);

                  return (
                    <tr key={entry.id}>
                      {canReview ? <td>{getSubmitterLabel(entry)}</td> : null}
                      <td>{entry.work_date?.split("T")[0]}</td>
                      <td>{entry.hours_worked}</td>
                      <td>{entry.is_billable ? "Yes" : "No"}</td>
                      <td style={{ textTransform: "capitalize" }}>{status}</td>
                      <td>{entry.rejection_note || "-"}</td>
                      <td>{entry.notes || "-"}</td>
                      <td className="icon-cell">
                        <Button variant="secondary" onClick={() => handleView(entry)}>
                          View
                        </Button>
                        {canEdit ? (
                          <>
                            <Button variant="primary" onClick={() => handleEdit(entry)}>
                              Edit
                            </Button>
                            <Button variant="danger" onClick={() => handleDelete(entry)}>
                              Delete
                            </Button>
                          </>
                        ) : null}
                        {canReview && status === "submitted" ? (
                          <>
                            <Button variant="complete" onClick={() => openReviewModal(entry, "approved")}>
                              Approve
                            </Button>
                            <Button variant="danger" onClick={() => openReviewModal(entry, "rejected")}>
                              Reject
                            </Button>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

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
              {submittableEntries.length > 0 ? (
                <Button variant="primary" pop onClick={() => setShowSubmitConfirm(true)}>
                  Submit Week
                </Button>
              ) : null}
            </div>
          ) : null}

          {canReview && pendingReviewEntries.length > 0 ? (
            <div style={{ marginTop: "16px", color: "#374151" }}>
              {pendingReviewEntries.length} submitted entr{pendingReviewEntries.length === 1 ? "y" : "ies"} waiting for review.
            </div>
          ) : null}
        </>
      )}

      {showAddEdit ? (
        <AddEditModal
          isOpen={showAddEdit}
          record={editingEntry}
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
          message="Submit all draft and rejected hours in this week for review?"
          onConfirm={handleSubmitHours}
          onCancel={() => {
            if (!isSubmittingHours) {
              setShowSubmitConfirm(false);
              setConfirmProgressMessage("");
            }
          }}
          confirmLabel={isSubmittingHours ? "Submitting..." : "Submit"}
          isLoading={isSubmittingHours}
          loadingMessage={confirmProgressMessage}
        />
      ) : null}

      {showReviewModal ? (
        <ConfirmModal
          message={
            reviewScope === "all"
              ? reviewAction === "approved"
                ? `Approve all ${pendingReviewEntries.length} submitted hour entries?`
                : `Reject all ${pendingReviewEntries.length} submitted hour entries and return them to the employee?`
              : reviewAction === "approved"
                ? "Approve this hour entry?"
                : "Reject this hour entry and return it to the employee?"
          }
          onConfirm={handleReview}
          onCancel={() => {
            if (!isReviewingHours) {
              resetReviewModal();
            }
          }}
          confirmLabel={
            isReviewingHours
              ? reviewAction === "approved"
                ? "Approving..."
                : "Rejecting..."
              : reviewAction === "approved"
                ? "Approve"
                : "Reject"
          }
          confirmVariant={reviewAction === "approved" ? "complete" : "danger"}
          isLoading={isReviewingHours}
          loadingMessage={confirmProgressMessage}
        >
          {reviewAction === "rejected" ? (
            <div style={{ marginTop: "12px" }}>
              <label htmlFor="hour-rejection-note" style={{ display: "block", marginBottom: "6px" }}>
                Rejection note
              </label>
              <textarea
                id="hour-rejection-note"
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                rows={4}
                style={{ width: "100%" }}
                disabled={isReviewingHours}
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

export default HourlyTracking;




