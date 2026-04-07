import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AddEditModal from "./shared/AddEditTimeModal";
import DeleteModal from "../components/DeleteModal";
import ConfirmModal from "../components/ConfirmModal";
import ResultModal from "../components/ResultModal";
import Header from "../components/Header";

import {
    getHours,
    createHourEntry,
    updateHourEntry,
    createSubmission,
    createSubmissionItem,
    softDeleteHour,
    markHourSubmitted,
} from "../services/api";

import "../css/hourlytracking.css";

function HourlyTracking() {
    const { clientId } = useParams();

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showAddEdit, setShowAddEdit] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);

    const [resultMessage, setResultMessage] = useState("");

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getHours();
            console.log("Hours API response:", data);

            // ✅ Ensure array
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
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="timeTracker">
                <Header title="Hourly Tracking" showBack />
                <div className="divider" />

                <div className="error-box">
                    <p>{error}</p>
                    <button onClick={loadEntries}>Retry</button>
                </div>
            </div>
        );
    }

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

    const handleSave = async (data) => {
        try {
            const payload = {
                user_id: 1, //replace with current user id later
                client_id: Number(clientId),
                work_date: data.work_date,
                hours_worked: data.hours_worked,
                notes: data.notes,
                is_billable: data.is_billable,
            };

            if (data.id) {
                await updateHourEntry(data.id, payload);
            } else {
                await createHourEntry(payload);
            }

            await loadEntries();
            setResultMessage("Hours saved successfully.");
        } catch (err) {
            console.error("Failed to save entry:", err);
            setError("Unable to save entry. Please try again.");
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
            setResultMessage("Entry deleted.");
        } catch (err) {
            console.error("Failed to delete entry:", err);
            setError("Unable to delete entry. Please try again.");
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handleSubmitHours = async () => {
        try {
            if (entries.length === 0) {
                setShowApproveConfirm(false);
                return;
            }

            const submission = await createSubmission({
                user_id: 1,
            });

            console.log("Submission response:", submission);

            // ✅ FIX: handle array response
            const submissionId = Array.isArray(submission)
                ? submission[0]?.id
                : submission?.id;

            if (!submissionId) {
                throw new Error("Invalid submission response");
            }

            for (const entry of entries) {
                await createSubmissionItem({
                    submission_id: submissionId,
                    hourly_entry_id: entry.id,
                });

                // NEW: mark entry as submitted
                await markHourSubmitted(entry.id);
            }

            setShowApproveConfirm(false);
            await loadEntries();
            setResultMessage("Hours submitted successfully.");
        } catch (err) {
            console.error("Failed to submit hours:", err);
            setError("Unable to submit hours. Please try again.");
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
                                            <span className="icon" onClick={() => handleView(entry)}>📄</span>
                                            <span className="icon" onClick={() => handleEdit(entry)}>✏️</span>
                                            <span className="icon" onClick={() => handleDelete(entry)}>❌</span>
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

                    <div className="submit-container">
                        <button
                            className="submit-btn-main"
                            onClick={() => setShowApproveConfirm(true)}
                        >
                            Submit
                        </button>
                    </div>
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

            <ResultModal
                message={resultMessage}
                onClose={() => {
                    setResultMessage("");
                    loadEntries();
                }}
            />
        </div>
    );
}

export default HourlyTracking;