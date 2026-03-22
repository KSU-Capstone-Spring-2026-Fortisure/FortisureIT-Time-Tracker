import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AddEditContractModal from "./shared/AddEditContractModal"
import DeleteModal from "../components/DeleteModal";
import Header from "../components/Header";

import "../css/contracts.css";

function Contracts() {
    const navigate = useNavigate();
    const { clientId } = useParams();

    const [contracts, setContracts] = useState([
        {
            id: 1,
            name: "24.12-B Team Creation Portal",
            value: "$$$",
            status: "Completed",
            start: "2025-02-04",
            end: "2025-04-03",
            owner: "Employee",
        },
        {
            id: 2,
            name: "25.03-A All-Star Upload Refactor",
            value: "$$$",
            status: "Completed",
            start: "2025-05-01",
            end: "2025-06-01",
            owner: "Employee",
        }
    ]);

    const [showAddEdit, setShowAddEdit] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contractToDelete, setContractToDelete] = useState(null);

    // Add
    const handleAdd = () => {
        setEditingContract(null);
        setIsViewMode(false);
        setShowAddEdit(true);
    };

    // Edit
    const handleEdit = (contract) => {
        setEditingContract(contract);
        setIsViewMode(false);
        setShowAddEdit(true);
    };

    // View
    const handleView = (contract) => {
        setEditingContract(contract);
        setIsViewMode(true);
        setShowAddEdit(true);
    };

    // Save
    const handleSave = (data) => {
        if (data.id) {
            setContracts(contracts.map(c => c.id === data.id ? data : c));
        } else {
            setContracts([
                ...contracts,
                { ...data, id: Date.now() }
            ]);
        }
    };

    // Delete
    const handleDelete = (contract) => {
        setContractToDelete(contract);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        setContracts(contracts.filter(c => c.id !== contractToDelete.id));
        setShowDeleteModal(false);
    };

    return (
        <div className="contracts">

            <Header title="Contracts" showBack />

            <div className="divider" />

            {/* Table */}
            <table>
                <thead>
                    <tr>
                        <th>Contract</th>
                        <th>Value</th>
                        <th>Status</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Owner</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {contracts.map(contract => (
                        <tr key={contract.id}>
                            <td>{contract.name}</td>
                            <td>{contract.value}</td>
                            <td>{contract.status}</td>
                            <td>{contract.start}</td>
                            <td>{contract.end}</td>
                            <td>{contract.owner}</td>
                            <td className="icon-cell">
                                <span className="icon" onClick={() => handleView(contract)}>📄</span>
                                <span className="icon" onClick={() => handleEdit(contract)}>✏️</span>
                                <span className="icon" onClick={() => handleDelete(contract)}>❌</span>
                                <span
                                    className="icon"
                                    onClick={() => navigate(`/contracts/${clientId}/milestones/${contract.id}`)}
                                >
                                    📋
                                </span>
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

            {/* Add/Edit/View Modal */}
            {showAddEdit && (
                <AddEditContractModal
                    isOpen={showAddEdit}
                    record={editingContract}
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
        </div>
    );
}

export default Contracts;