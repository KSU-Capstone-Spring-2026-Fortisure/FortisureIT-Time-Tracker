import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import DeleteModal from "../components/DeleteModal";
import ConfirmModal from "../components/ConfirmModal";
import ResultModal from "../components/ResultModal";
import AddEditContractModal from "./shared/AddEditContractModal";
import {
    getContracts,
    getUsers,
    createContract,
    updateContract,
    softDeleteContract,
} from "../services/api";

import "../css/contracts.css";

const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}/${mm}/${dd}`;
};

function Contracts() {
    const { clientId } = useParams();
    const navigate = useNavigate();

    const [contracts, setContracts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showAddEdit, setShowAddEdit] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contractToDelete, setContractToDelete] = useState(null);

    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [resultMessage, setResultMessage] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [contractsData, usersData] = await Promise.all([
                getContracts(),
                getUsers(),
            ]);

            console.log("Contracts API:", contractsData);
            console.log("Users API:", usersData);

            // ✅ Ensure arrays
            const safeContracts = Array.isArray(contractsData) ? contractsData : [];
            const safeUsers = Array.isArray(usersData) ? usersData : [];

            const filteredContracts = safeContracts.filter(
                (c) =>
                    String(c.client_id) === String(clientId) &&
                    c.is_deleted !== true
            );

            setContracts(filteredContracts);
            setUsers(safeUsers);
        } catch (err) {
            console.error("Failed to load contracts:", err);
            setError("Unable to load contracts. Please try again.");
            setContracts([]);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="contracts-page">
                <Header title="Contracts" showBack />
                <div className="divider" />

                <div className="error-box">
                    <p>{error}</p>
                    <button onClick={loadData}>Retry</button>
                </div>
            </div>
        );
    }

    const getOwnerName = (ownerId) => {
        const user = users.find((u) => String(u.id) === String(ownerId));
        return user ? user.name || user.full_name || `User ${ownerId}` : ownerId;
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

    const handleSave = async (data) => {
        try {
            const payload = {
                client_id: Number(clientId),
                contract_name: data.contract_name,
                description: data.description,
                total_value: data.total_value,
                start_date: data.start_date,
                end_date: data.end_date,
                created_by: 1,
            };

            if (editingContract && editingContract.id) {
                await updateContract(editingContract.id, payload);
            } else {
                await createContract(payload);
            }

            await loadData();
            setResultMessage("Contract saved successfully.");
        } catch (err) {
            console.error("Failed to save contract:", err);
            setError("Unable to save contract. Please try again.");
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
            setResultMessage("Contract deleted.");
        } catch (err) {
            console.error("Failed to delete contract:", err);
            setError("Unable to delete contract. Please try again.");
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handleSubmitContracts = async () => {
        setShowSubmitConfirm(false);
        setResultMessage("Contracts submitted.");
    };

    return (
        <div className="contracts-page">
            <Header title="Contracts" showBack />

            <div className="divider" />

            {loading && <p>Loading contracts...</p>}

            {!loading && (
                <>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Contract Name</th>
                                    <th>Total Value</th>
                                    <th>Owner</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {contracts.length === 0 ? (
                                    <tr>
                                        <td colSpan="6">No contracts found.</td>
                                    </tr>
                                ) : (
                                    contracts.map((c) => (
                                        <tr key={c.id}>
                                            <td>{c.contract_name}</td>
                                            <td>{c.total_value}</td>
                                            <td>{getOwnerName(c.created_by)}</td>
                                            <td>{formatDate(c.start_date)}</td>
                                            <td>{formatDate(c.end_date)}</td>
                                            <td className="icon-cell">
                                                <span className="icon" onClick={() => handleView(c)}>📄</span>
                                                <span className="icon" onClick={() => handleEdit(c)}>✏️</span>
                                                <span className="icon" onClick={() => handleDelete(c)}>❌</span>
                                                <span
                                                    className="icon"
                                                    onClick={() =>
                                                        navigate(`/contracts/${clientId}/milestones/${c.id}`)
                                                    }
                                                >
                                                    📌
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="add-container">
                        <button className="add-btn" onClick={handleAdd}>
                            Add
                        </button>
                    </div>

                    <div className="submit-container">
                        <button
                            className="submit-btn-main"
                            onClick={() => setShowSubmitConfirm(true)}
                        >
                            Submit
                        </button>
                    </div>
                </>
            )}

            {showAddEdit && (
                <AddEditContractModal
                    isOpen={showAddEdit}
                    record={editingContract}
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

            {showSubmitConfirm && (
                <ConfirmModal
                    message={"Submit contracts for processing?"}
                    onConfirm={handleSubmitContracts}
                    onCancel={() => setShowSubmitConfirm(false)}
                />
            )}

            <ResultModal
                message={resultMessage}
                onClose={() => {
                    setResultMessage("");
                    loadData();
                }}
            />
        </div>
    );
}

export default Contracts;