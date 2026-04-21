import { useEffect, useMemo, useState } from "react";

import Header from "../components/Header";
import ResultModal from "../components/ResultModal";
import ConfirmModal from "../components/ConfirmModal";
import DeleteModal from "../components/DeleteModal";
import BugFeatureModal from "./shared/BugFeatureModal";
import Button from "../components/Button";

import {
  getBugs,
  createBug,
  updateBug,
  completeBug,
  softDeleteBug,
} from "../services/api";

import { useRole } from "../context/RoleContext";
import "../css/bugfeaturerequest.css";

const SORT_ICONS = {
  asc: "\u2191",
  desc: "\u2193",
  idle: "\u2195",
};

function BugFeatureRequest() {
  const { role, isManagerLike, currentUserId, loadingUsers } = useRole();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: "",
    severity: "Low",
    description: "",
  });

  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSavingRequest, setIsSavingRequest] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToComplete, setItemToComplete] = useState(null);
  const [isCompletingRequest, setIsCompletingRequest] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const [error, setError] = useState("");
  const [debugError, setDebugError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "title", direction: "asc" });

  const canComplete = isManagerLike(role);

  useEffect(() => {
    if (loadingUsers || !currentUserId) {
      return;
    }

    loadBugs();
  }, [currentUserId, loadingUsers, role]);

  const loadBugs = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getBugs({
        include_completed: false,
        viewer_role: role,
        viewer_user_id: currentUserId,
      });

      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load bugs:", err);
      setError("Unable to load requests. Please try again.");
      setDebugError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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

  const openCompleteModal = (item) => {
    setItemToComplete(item);
    setShowConfirmModal(true);
  };

  const handleMarkComplete = async () => {
    if (!itemToComplete) {
      return;
    }

    setIsCompletingRequest(true);

    try {
      await completeBug(itemToComplete.id, {
        completed_by: currentUserId,
        viewer_role: role,
      });
      await loadBugs();

      setShowConfirmModal(false);
      setItemToComplete(null);
      setResultMessage("Request marked as complete.");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to mark complete:", err);
      setError("Unable to update request.");
      setDebugError(String(err?.message || err));
    } finally {
      setIsCompletingRequest(false);
    }
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) {
      return;
    }

    try {
      await softDeleteBug(itemToDelete.id, {
        viewer_user_id: currentUserId,
      });
      await loadBugs();
      setShowDeleteModal(false);
      setItemToDelete(null);
      setResultMessage("Request deleted.");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to delete request:", err);
      setError("Unable to delete request.");
      setDebugError(String(err?.message || err));
    }
  };

  const handleSubmit = async () => {
    setIsSavingRequest(true);

    try {
      if (editingItem) {
        await updateBug(editingItem.id, {
          ...form,
          viewer_user_id: currentUserId,
          viewer_role: role,
        });
      } else {
        await createBug({
          user_id: currentUserId,
          request_type: "Bug",
          title: form.title,
          severity: form.severity,
          description: form.description,
        });
      }

      await loadBugs();
      setShowEditModal(false);
      setEditingItem(null);
      setResultMessage("Request saved successfully.");
      setShowResult(true);
    } catch (err) {
      console.error("Failed to submit request:", err);
      setError("Unable to submit request. Please try again.");
      setDebugError(String(err?.message || err));
    } finally {
      setIsSavingRequest(false);
    }
  };

  const rows = useMemo(() => {
    const mappedRows = items.map((item) => ({
      ...item,
      canEdit: String(item.user_id) === String(currentUserId) && !item.completed,
      canComplete,
    }));

    const getSortValue = (item) => {
      switch (sortConfig.key) {
        case "severity":
          return String(item.severity || "").toLowerCase();
        case "status":
          return String(item.completed ? "complete" : item.status || "open").toLowerCase();
        case "description":
          return String(item.description || "").toLowerCase();
        case "title":
        default:
          return String(item.title || "").toLowerCase();
      }
    };

    mappedRows.sort((left, right) => {
      const comparison = getSortValue(left).localeCompare(getSortValue(right)) || Number(right.id || 0) - Number(left.id || 0);
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return mappedRows;
  }, [canComplete, currentUserId, items, sortConfig]);

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

  if (error) {
    return (
      <div className="bug-report">
        <Header title="Bugs & Feature Requests" showBack />
        <div className="divider" />

        <div className="error-box">
          <p>{error}</p>
          {debugError && <pre className="debug-error">{debugError}</pre>}
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

          {(loading || loadingUsers) && <p>Loading requests...</p>}

          {!loading && !loadingUsers && (
            <>
              <table>
                <thead>
                  <tr>
                    <th>{renderSortableHeader("Title", "title")}</th>
                    <th>{renderSortableHeader("Severity", "severity")}</th>
                    <th>{renderSortableHeader("Status", "status")}</th>
                    <th>{renderSortableHeader("Description", "description")}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="5">No requests found.</td>
                    </tr>
                  ) : (
                    rows.map((item) => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.severity}</td>
                        <td>{item.completed ? "Complete" : item.status || "Open"}</td>
                        <td>{item.description}</td>
                        <td className="icon-cell">
                          {item.canEdit ? (
                            <Button variant="primary" pop onClick={() => handleEdit(item)}>
                              Edit
                            </Button>
                          ) : null}
                          {item.canEdit ? (
                            <Button variant="danger" pop onClick={() => handleDelete(item)}>
                              Delete
                            </Button>
                          ) : null}
                          {item.canComplete && !item.completed ? (
                            <Button variant="complete" pop onClick={() => openCompleteModal(item)}>
                              Set To Complete
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
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

      {showEditModal && (
        <BugFeatureModal
          form={form}
          onChange={updateField}
          onSave={handleSubmit}
          onCancel={() => setShowEditModal(false)}
          isEditing={!!editingItem}
          isSaving={isSavingRequest}
        />
      )}

      {showConfirmModal && (
        <ConfirmModal
          message="Are you sure you want to mark this as complete?"
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handleMarkComplete}
          isLoading={isCompletingRequest}
          loadingMessage={isCompletingRequest ? "Updating request..." : ""}
          confirmLabel={isCompletingRequest ? "Updating..." : "Confirm"}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onCancel={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onConfirm={confirmDelete}
        />
      )}

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

export default BugFeatureRequest;
