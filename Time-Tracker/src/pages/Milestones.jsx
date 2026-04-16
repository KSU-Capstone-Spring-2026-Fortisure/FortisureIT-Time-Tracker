import { useState, useEffect } from "react";
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
import { sanitizeNumber, sleep } from "./shared/helpers";

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
};

function Milestones() {
  const { clientId, contractId } = useParams();

  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugError, setDebugError] = useState("");

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

  //controls ResultModal visibility
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

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
      setCurrentPage(1); // reset pagination
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

  // SAVE
  const handleSubmit = async () => {
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

      // Show result modal
      setResultMessage("Milestone saved.");
      setShowResult(true);

    } catch (err) {
      console.error("Failed to save milestone:", err);
      setResultMessage("Unable to save milestone. Please try again.");
      setShowResult(true);
    }
  };

  // DELETE
  const handleDelete = (m) => {
    setMilestoneToDelete(m);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await softDeleteMilestone(milestoneToDelete.id);
      await loadMilestones();
      setShowDeleteModal(false);

      // Show result modal
      setResultMessage("Milestone deleted.");
      setShowResult(true);

    } catch (err) {
      console.error("Failed to delete milestone:", err);
      setError("Unable to delete milestone. Please try again.");
      setDebugError(String(err?.message || err));
    }
  };

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

  // Pagination calculations
  const totalPages = Math.ceil(milestones.length / pageSize);

  const paginatedMilestones = milestones.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pageWindow = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((page) => page >= currentPage - 2 && page <= currentPage + 2);

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
                {paginatedMilestones.map((m) => (
                  <tr key={m.id}>
                    <td>{m.milestone_name}</td>
                    <td>{m.amount}</td>
                    <td>{formatDate(m.due_date)}</td>
                    <td>{m.description}</td>
                    <td className="icon-cell">
                      <Button variant="primary" pop onClick={() => handleEdit(m)}>
                        Edit
                      </Button>
                      <Button variant="danger" pop onClick={() => handleDelete(m)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                {"<<"}
              </Button>

              <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                {">"}
              </Button>

              <Button
                variant="secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                {">>"}
              </Button>
            </div>
          )}

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
          setShowResult(false);
          setResultMessage("");
        }}
      />
    </div>
  );
}

export default Milestones;