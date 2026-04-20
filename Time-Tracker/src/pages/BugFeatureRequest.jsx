import { useEffect, useMemo, useState } from "react";

import Header from "../components/Header";
import ResultModal from "../components/ResultModal";
import ConfirmModal from "../components/ConfirmModal";
import BugFeatureModal from "./shared/BugFeatureModal";
import Button from "../components/Button";

import {
  getBugs,
  createBug,
  updateBug,
  completeBug,
} from "../services/api";

import { useRole } from "../context/RoleContext";
import "../css/bugfeaturerequest.css";

function BugFeatureRequest() {
  const { role, isManagerLike, currentUser, currentUserId, loadingUsers } = useRole();
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

  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const [error, setError] = useState("");
  const [debugError, setDebugError] = useState("");
  const [loading, setLoading] = useState(true);

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
    return items.map((item) => ({
      ...item,
      canEdit: !canComplete && String(item.user_id) === String(currentUserId),
      canComplete,
    }));
  }, [canComplete, currentUserId, items]);

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
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th></th>
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
