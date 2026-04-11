import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import DeleteModal from "../components/DeleteModal";
import ConfirmModal from "../components/ConfirmModal";
import ResultModal from "../components/ResultModal";
import AddEditContractModal from "./shared/AddEditContractModal";
import Button from "../components/Button";

import {
    getContracts,
    getUsers,
    createContract,
    updateContract,
    softDeleteContract,
} from "../services/api";
import "../css/contracts.css";

import { sanitizeNumber, sleep } from "./shared/helpers"

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
    const [debugError, setDebugError] = useState("");

    const [showAddEdit, setShowAddEdit] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contractToDelete, setContractToDelete] = useState(null);

    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    // ⭐ NEW: controls ResultModal visibility
    const [showResult, setShowResult] = useState(false);
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
            setDebugError(String(err?.message || err));
            setContracts([]);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

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

    // SAVE
    const handleSave = async (data) => {
        try {
            const payload = {
                client_id: Number(clientId),
                contract_name: data.contract_name,
                description: data.description,
                total_value: sanitizeNumber(data.total_value),
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
            setShowAddEdit(false);

            // ⭐ Show result modal
            setResultMessage("Contract saved successfully.");
            setShowResult(true);

        } catch (err) {
            console.error("Failed to save contract:", err);
            setError("Unable to save contract. Please try again.");
            setDebugError(String(err?.message || err));
        }
    };

    // DELETE
    const handleDelete = (contract) => {
        setContractToDelete(contract);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await softDeleteContract(contractToDelete.id);
            await loadData();
            setShowDeleteModal(false);

            // ⭐ Show result modal
            setResultMessage("Contract deleted.");
            setShowResult(true);

        } catch (err) {
            console.error("Failed to delete contract:", err);
            setError("Unable to delete contract. Please try again.");
            setDebugError(String(err?.message || err));
        }
    };

    // SUBMIT CONTRACTS
    const handleSubmitContracts = async () => {
        try {
            setShowSubmitConfirm(false);

            // ⭐ Show result modal
            setResultMessage("Contracts submitted.");
            setShowResult(true);

        } catch (err) {
            console.error("Failed to submit contracts:", err);
            setError("Unable to submit contracts.");
            setDebugError(String(err?.message || err));
        }
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
                                                <Button variant="secondary" onClick={() => handleView(c)}>
                                                    View
                                                </Button>

                                                <Button variant="primary" onClick={() => handleEdit(c)}>
                                                    Edit
                                                </Button>

                                                <Button variant="danger" onClick={() => handleDelete(c)}>
                                                    Delete
                                                </Button>

                                                <Button
                                                    variant="secondary"
                                                    onClick={() =>
                                                        navigate(`/contracts/${clientId}/milestones/${c.id}`)
                                                    }
                                                >
                                                    Milestones
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="add-container">
                        <button className="add-btn" onClick={handleAdd}>Add</button>
                    </div>

                    {contracts.length > 0 && (
                        <div className="submit-container">
                            <button
                                className="submit-btn-main"
                                onClick={() => setShowSubmitConfirm(true)}
                            >
                                Submit
                            </button>
                        </div>
                    )}
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

            {/* ⭐ FIXED: Result modal now closes properly */}
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

export default Contracts;