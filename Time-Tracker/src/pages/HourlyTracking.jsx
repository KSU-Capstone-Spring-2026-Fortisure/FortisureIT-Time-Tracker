import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddEditModal from "./shared/AddEditTimeModal";
import DeleteModal from "../components/DeleteModal";
import ConfirmModal from "../components/ConfirmModal";
import Header from "../components/Header";

import "../css/hourlytracking.css";

function HourlyTracking() {
    const navigate = useNavigate();

    const [entries, setEntries] = useState([
        {
            id: 1,
            clientName: "Client Name",
            dateWorked: "2026-02-14",
            timeWorked: 0.5,
            category: "Meeting/PM",
            billable: true,
            notes: "Initial meeting",
            isDisabled: false
        }
    ]);

    const [showAddEdit, setShowAddEdit] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);

    // Add
    const handleAdd = () => {
        setEditingEntry(null);
        setIsViewMode(false);
        setShowAddEdit(true);
    };

    // Edit
    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setIsViewMode(entry.isDisabled || false);
        setShowAddEdit(true);
    };

    // View
    const handleView = (entry) => {
        setEditingEntry(entry);
        setIsViewMode(true);
        setShowAddEdit(true);
    };

    // Save
    const handleSave = (data) => {
        if (data.id) {
            setEntries(entries.map(e =>
                e.id === data.id ? data : e
            ));
        } else {
            setEntries([
                ...entries,
                { ...data, id: Date.now(), isDisabled: false }
            ]);
        }
    };

    // Delete
    const handleDelete = (entry) => {
        setEntryToDelete(entry);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        setEntries(entries.filter(e => e.id !== entryToDelete.id));
        setShowDeleteModal(false);
    };

    return (
        <div className="timeTracker">

            <Header title="Hourly Tracking" showBack />

            <div className="divider" />

            {/* Table */}
            <table>
                <thead>
                    <tr>
                        <th>Client</th>
                        <th>Date Worked</th>
                        <th>Time</th>
                        <th>Category</th>
                        <th>Billable</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map(entry => (
                        <tr key={entry.id}>
                            <td>{entry.clientName}</td>
                            <td>{entry.dateWorked}</td>
                            <td>{entry.timeWorked}</td>
                            <td>{entry.category}</td>
                            <td>{entry.billable ? "Yes" : "No"}</td>
                            <td className="icon-cell">
                                <span className="icon" onClick={() => handleView(entry)}>📄</span>
                                <span className="icon" onClick={() => handleEdit(entry)}>✏️</span>
                                <span className="icon" onClick={() => handleDelete(entry)}>❌</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Add */}
            <div className="add-container">
                <button className="add-btn" onClick={handleAdd}>
                    Add
                </button>
            </div>
            {/* Submit */}
            <div className="submit-container">
                <button
                    className="submit-btn-main"
                    onClick={() => setShowApproveConfirm(true)}
                >
                    Submit
                </button>
            </div>

            {/* Add/Edit/View Modal */}
            {showAddEdit && (
                <AddEditModal
                    isOpen={showAddEdit}
                    record={editingEntry}
                    isViewMode={isViewMode}
                    onSave={handleSave}
                    onClose={() => setShowAddEdit(false)}
                />
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <DeleteModal
                    isOpen={showDeleteModal}
                    onConfirm={confirmDelete}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}

            {showApproveConfirm && (
                <ConfirmModal
                    message="Would you like to approve your hours for billing? Note: This action cannot be undone."
                    onConfirm={() => {
                        setShowApproveConfirm(false);
                        // future API call
                    }}
                    onCancel={() => setShowApproveConfirm(false)}
                />
            )}
        </div>
    );
}

export default HourlyTracking;
