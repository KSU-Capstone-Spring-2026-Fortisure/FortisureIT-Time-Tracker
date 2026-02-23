import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DeleteModal from "../components/DeleteModal";

import "../css/milestones.css";

function Milestones() {
    const navigate = useNavigate();
    const { clientId, contractId } = useParams();

    const [milestones, setMilestones] = useState([
        {
            id: 1,
            name: "Research & Planning",
            value: "$$$",
            assignee: "Employee",
            estBillDate: "2025-03-05",
            approved: true
        },
        {
            id: 2,
            name: "Display & Control",
            value: "$$$",
            assignee: "Employee",
            estBillDate: "2025-04-01",
            approved: true
        }
    ]);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [milestoneToDelete, setMilestoneToDelete] = useState(null);

    const handleDelete = (m) => {
        setMilestoneToDelete(m);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        setMilestones(milestones.filter(m => m.id !== milestoneToDelete.id));
        setShowDeleteModal(false);
    };

    return (
        <div className="milestones-page">

            <div className="header-row">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <div className="title-group">
                    <h1>Milestones</h1>
                </div>
            </div>

            <div className="divider" />

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Milestone</th>
                            <th>Value</th>
                            <th>Assignee</th>
                            <th>Est Bill Date</th>
                            <th>Approved</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {milestones.map(m => (
                            <tr key={m.id}>
                                <td>{m.name}</td>
                                <td>{m.value}</td>
                                <td>{m.assignee}</td>
                                <td>{m.estBillDate}</td>
                                <td>{m.approved ? "Yes" : "No"}</td>
                                <td className="icon-cell">
                                    <span
                                        className="icon"
                                        onClick={() =>
                                            navigate(`/contracts/${clientId}/milestones/${contractId}/edit/${m.id}`)
                                        }
                                    >
                                        ✏️
                                    </span>
                                    <span className="icon" onClick={() => handleDelete(m)}>❌</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="add-button-container">
                <button
                    className="add-button"
                    onClick={() =>
                        navigate(`/contracts/${clientId}/milestones/${contractId}/add`)
                    }
                >
                    Add
                </button>
            </div>

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

export default Milestones;