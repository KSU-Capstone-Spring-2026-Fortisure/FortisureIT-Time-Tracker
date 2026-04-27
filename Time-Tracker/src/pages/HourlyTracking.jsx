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
  getClients,
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
const SORT_ICONS = {
  asc: "\u2191",
  desc: "\u2193",
  idle: "\u2195",
};
const HOURLY_STATUS_ORDER = {
  draft: 1,
  submitted: 2,
  approved: 3,
  rejected: 4,
};

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

const getSubmitterLabel = (entry) => entry.user_name || entry.submitted_by_name || `User ${entry.user_id}`;

function HourlyTracking() {
  const { clientId } = useParams();
  const { role, currentUserId, managedUserIds, canAccessFeature, isManagerLike, loadingUsers } = useRole();

  const [entries, setEntries] = useState([]);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugError, setDebugError] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "work_date", direction: "desc" });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all");

  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitTargets, setSubmitTargets] = useState([]);
  const [submitPrompt, setSubmitPrompt] = useState("");
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
      const [hoursData, clientsData] = await Promise.all([
        getHours({
          client_id: clientId,
          viewer_role: role,
          viewer_user_id: currentUserId,
        }),
        getClients({
          mode: "hourly",
          viewer_role: role,
          viewer_user_id: currentUserId,
        }),
      ]);

      const safeEntries = Array.isArray(hoursData) ? hoursData : [];
      const safeClients = Array.isArray(clientsData) ? clientsData : [];
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

      const matchingClient = safeClients.find((client) => String(client.id) === String(clientId));

      setEntries(filteredEntries);
      setClientName(matchingClient?.client_name || filteredEntries[0]?.client_name || "");
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

  const getSortValue = (entry, key) => {
    switch (key) {
      case "submitted_by":
        return getSubmitterLabel(entry).toLowerCase();
      case "work_date":
        return parseDateOnly(entry.work_date).getTime();
      case "hours_worked":
        return Number(entry.hours_worked || 0);
      case "is_billable":
        return entry.is_billable ? 1 : 0;
      case "status":
        return HOURLY_STATUS_ORDER[getEntryStatus(entry)] || 0;
      case "rejection_note":
        return String(entry.rejection_note || "").toLowerCase();
      case "notes":
        return String(entry.notes || "").toLowerCase();
      default:
        return String(entry[key] || "").toLowerCase();
    }
  };

  const sortedEntries = useMemo(() => {
    const sorted = [...entries];

    sorted.sort((left, right) => {
      const leftValue = getSortValue(left, sortConfig.key);
      const rightValue = getSortValue(right, sortConfig.key);

      let comparison = 0;

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        comparison = leftValue - rightValue;
      } else {
        comparison = String(leftValue).localeCompare(String(rightValue));
      }

      if (comparison === 0) {
        comparison = Number(right.id || 0) - Number(left.id || 0);
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [entries, sortConfig]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [sortConfig, selectedEmployeeId]);

  const displayedEntries = useMemo(() => {
    if (selectedEmployeeId === "all") {
      return sortedEntries;
    }

    return sortedEntries.filter((entry) => String(entry.user_id) === String(selectedEmployeeId));
  }, [selectedEmployeeId, sortedEntries]);

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

  const toggleSort = (key) => {
    setSortConfig((current) => (
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    ));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return SORT_ICONS.idle;
    return sortConfig.direction === "asc" ? SORT_ICONS.asc : SORT_ICONS.desc;
  };

  const renderSortableHeader = (label, key) => (
    <button type="button" className="sort-header-button" onClick={() => toggleSort(key)}>
      <span>{label}</span>
      <span className="sort-header-icon">{getSortIcon(key)}</span>
    </button>
  );

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

  const openSubmitModal = (targets, prompt) => {
    setSubmitTargets(targets);
    setSubmitPrompt(prompt);
    setConfirmProgressMessage("");
    setShowSubmitConfirm(true);
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

  const handleSubmitHours = async () => {
    if (submitTargets.length === 0) {
      return;
    }

    setIsSubmittingHours(true);

    try {
      for (const [index, entry] of submitTargets.entries()) {
        setConfirmProgressMessage(`Submitting entry ${index + 1} of ${submitTargets.length}...`);
        await markHourSubmitted(entry.id, { submitted_by: currentUserId });
      }

      await loadEntries();
      setShowSubmitConfirm(false);
      setSubmitTargets([]);
      setSubmitPrompt("");
      setConfirmProgressMessage("");
      setResultMessage(submitTargets.length === 1 ? "Hour entry submitted successfully." : "Hours submitted successfully.");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to submit hours:", err);
      setError("Unable to submit hours. Please try again.");
      setDebugError(String(err?.message || err));
    } finally {
      setIsSubmittingHours(false);
    }
  };

  const resetReviewModal = () => {
    setShowReviewModal(false);
    setEntryToReview(null);
    setReviewNote("");
    setReviewScope("single");
    setConfirmProgressMessage("");
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
      <Header title="Hourly Tracking" subtitle={clientName ? `Client: ${clientName}` : ""} showBack />
      <div className="divider" />

      <div className="tracking-toolbar">
        <div className="tracking-toolbar-group">
          <Button variant="secondary" onClick={() => setSelectedDate(toDateInputValue(addDays(weekStart, -7)))}>
            {"<"}
          </Button>
          <div>
            <strong>Week of {weekLabel}</strong>
            <div className="tracking-toolbar-note">Showing entries within the selected week.</div>
          </div>
          <Button variant="secondary" onClick={() => setSelectedDate(toDateInputValue(addDays(weekStart, 7)))}>
            {">"}
          </Button>
        </div>

        <div className="tracking-toolbar-group">
          {canReview && visibleEmployeeOptions.length > 1 ? (
            <div className="tracking-toolbar-group">
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
          <div className="tracking-toolbar-group">
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

      <div className="tracking-total">Weekly Total: {Number(weeklyTotal || 0).toFixed(2)}</div>

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
            <div className="bulk-review-actions">
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
                {canReview ? <th>{renderSortableHeader("Submitted By", "submitted_by")}</th> : null}
                <th>{renderSortableHeader("Date Worked", "work_date")}</th>
                <th>{renderSortableHeader("Hours", "hours_worked")}</th>
                <th>{renderSortableHeader("Billable", "is_billable")}</th>
                <th>{renderSortableHeader("Status", "status")}</th>
                <th>{renderSortableHeader("Rejection Note", "rejection_note")}</th>
                <th>{renderSortableHeader("Notes", "notes")}</th>
                <th>Actions</th>
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
                            <Button variant="complete" onClick={() => openSubmitModal([entry], "Submit this hour entry for review?")}>
                              Submit
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
            <div className="page-actions">
              <Button variant="primary" onClick={handleAdd}>
                Add
              </Button>
              {submittableEntries.length > 0 ? (
                <Button
                  variant="primary"
                  onClick={() => openSubmitModal(submittableEntries, "Submit all draft and rejected hours in this week for review?")}
                >
                  Submit Week
                </Button>
              ) : null}
            </div>
          ) : null}

          {canReview && pendingReviewEntries.length > 0 ? (
            <div className="pending-review-note">
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
          message={submitPrompt}
          onConfirm={handleSubmitHours}
          onCancel={() => {
            if (!isSubmittingHours) {
              setShowSubmitConfirm(false);
              setSubmitTargets([]);
              setSubmitPrompt("");
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
