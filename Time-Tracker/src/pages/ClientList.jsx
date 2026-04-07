import { useEffect, useState } from "react";
import Header from "../components/Header";
import ClientCard from "../components/ClientCard";
import "../css/clientList.css";
import { useParams } from "react-router-dom";
import { getClients } from "../services/api";

function ClientList() {
    const { mode } = useParams();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getClients();
            console.log("API response:", data);

            // ✅ Always ensure it's an array
            if (Array.isArray(data)) {
                setClients(data);
            } else {
                console.warn("Unexpected API format:", data);
                setClients([]);
            }
        } catch (err) {
            console.error("Failed to load clients:", err);
            setError("Unable to load clients. Please try again.");
            setClients([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="clientList">
            <Header title="Client List" showBack />
            <div className="divider" />

            {error && (
                <div className="error-box">
                    <p>{error}</p>
                    <button onClick={loadClients}>Retry</button>
                </div>
            )}

            {loading && <p>Loading clients...</p>}

            {!loading && !error && (
                <div className="clientList-page">
                    <div className="clientList-content">
                        <div className="client-grid">
                            {clients.length === 0 ? (
                                <p>No clients found.</p>
                            ) : (
                                clients.map(client => (
                                    <ClientCard
                                        key={client.id}
                                        id={client.id}
                                        name={client.client_name || client.name}
                                        path={
                                            mode === "contracts"
                                                ? `/contracts/${client.id}`
                                                : `/hourly/${client.id}`
                                        }
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClientList;