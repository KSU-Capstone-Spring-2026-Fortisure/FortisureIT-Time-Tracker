import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
    createSubmission,
    createSubmissionItem,
    softDeleteHour,
    markHourSubmitted,
} from "../services/api";

import { sanitizeNumber, sleep } from "./shared/helpers";

import "../css/hourlytracking.css";

function HourlyTracking() {
    const { clientId } = useParams();
    const navigate = useNavigate();

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");
    const [debugError, setDebugError] = useState("");

    const [showAddEdit, setShowAddEdit] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);

    // controls ResultModal visibility
    const [showResult, setShowResult] = useState(false);
    const [resultMessage, setResultMessage] = useState("");

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getHours();
            const safeData = Array.isArray(data) ? data : [];

            const filtered = safeData.filter(
                (e) =>
                    String(e.client_id) === String(clientId) &&
                    e.is_submitted === false &&
                    e.is_deleted !== true
            );

            setEntries(filtered);
        } catch (err) {
            console.error("Failed to load hours:", err);
            setError("Unable to load hourly entries. Please try again.");
            setDebugError(String(err?.message || err));
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

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

    // SAVE
    const handleSave = async (data) => {
        try {
            const payload = {
                user_id: 1,
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

            // Show result modal
            setResultMessage("Hours saved successfully.");
            setShowResult(true);

        } catch (err) {
            console.error("Failed to save entry:", err);
            setError("Unable to save entry. Please try again.");
            setDebugError(String(err?.message || err));
        }
    };

    // DELETE
    const handleDelete = (entry) => {
        setEntryToDelete(entry);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await softDeleteHour(entryToDelete.id);
            await loadEntries();
            setShowDeleteModal(false);

            // Show result modal
            setResultMessage("Entry deleted.");
            setShowResult(true);

        } catch (err) {
            console.error("Failed to delete entry:", err);
            setError("Unable to delete entry. Please try again.");
            setDebugError(String(err?.message || err));
        }
    };

    // SUBMIT HOURS
    const handleSubmitHours = async () => {
        try {
            if (entries.length === 0) {
                setShowApproveConfirm(false);
                return;
            }

            const submission = await createSubmission({ user_id: 1 });

            const submissionId = Array.isArray(submission)
                ? submission[0]?.id
                : submission?.id;

            if (!submissionId) throw new Error("Invalid submission response");

            for (const entry of entries) {
                await createSubmissionItem({
                    submission_id: submissionId,
                    hourly_entry_id: entry.id,
                });

                await markHourSubmitted(entry.id);
            }

            setShowApproveConfirm(false);
            await loadEntries();

            // Show result modal
            setResultMessage("Hours submitted successfully.");
            setShowResult(true);

            navigate("/");

        } catch (err) {
            console.error("Failed to submit hours:", err);
            setError("Unable to submit hours. Please try again.");
            setDebugError(String(err?.message || err));
            setShowApproveConfirm(false);
        }
    };

    return (
        <div className="timeTracker">
            <Header title="Hourly Tracking" showBack />
            <div className="divider" />

            {loading && <p>Loading hourly entries...</p>}

            {!loading && (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>Date Worked</th>
                                <th>Hours</th>
                                <th>Billable</th>
                                <th>Notes</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan="5">No entries found.</td>
                                </tr>
                            ) : (
                                entries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>{entry.work_date?.split("T")[0]}</td>
                                        <td>{entry.hours_worked}</td>
                                        <td>{entry.is_billable ? "Yes" : "No"}</td>
                                        <td>{entry.notes}</td>
                                        <td className="icon-cell">
                                            <Button variant="secondary" onClick={() => handleView(entry)}>
                                                View
                                            </Button>

                                            <Button variant="primary" onClick={() => handleEdit(entry)}>
                                                Edit
                                            </Button>

                                            <Button variant="danger" onClick={() => handleDelete(entry)}>
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="add-container">
                        <Button variant="primary" pop onClick={handleAdd}>
                            Add
                        </Button>
                    </div>

                    {entries.length > 0 && (
                        <div className="submit-container">
                            <Button
                                variant="primary"
                                pop
                                onClick={() => setShowApproveConfirm(true)}
                            >
                                Submit
                            </Button>
                        </div>
                    )}
                </>
            )}

            {showAddEdit && (
                <AddEditModal
                    isOpen={showAddEdit}
                    record={editingEntry}
                    isViewMode={isViewMode}
                    onSave={handleSave}
                    onClose={() => setShowAddEdit(false)}
                />
            )}

            {showDeleteModal && (
                <DeleteModal
                    isOpen={showDeleteModal}
                    onConfirm={confirmDelete}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}

            {showApproveConfirm && (
                <ConfirmModal
                    message={
                        "Would you like to approve your hours for billing?\nNote: This action cannot be undone."
                    }
                    onConfirm={handleSubmitHours}
                    onCancel={() => setShowApproveConfirm(false)}
                />
            )}

            {/* Result modal now closes properly */}
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