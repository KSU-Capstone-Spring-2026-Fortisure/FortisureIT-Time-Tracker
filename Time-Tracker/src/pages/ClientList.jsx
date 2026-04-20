import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import ClientCard from "../components/ClientCard";
import "../css/clientList.css";
import { getClients } from "../services/api";
import { useRole } from "../context/RoleContext";

function ClientList() {
  const { mode } = useParams();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugError, setDebugError] = useState("");
  const { role, canAccessFeature, currentUserId, loadingUsers } = useRole();

  const isModeAllowed =
    (mode === "hourly" && canAccessFeature(role, "hourly")) ||
    (mode === "contracts" && canAccessFeature(role, "contracts"));

  useEffect(() => {
    if (loadingUsers) {
      return;
    }

    if (!isModeAllowed || !currentUserId) {
      setClients([]);
      setLoading(false);
      return;
    }

    loadClients();
  }, [currentUserId, isModeAllowed, loadingUsers, mode, role]);

  const loadClients = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getClients({
        mode,
        viewer_role: role,
        viewer_user_id: currentUserId,
      });

      const safeClients = Array.isArray(data) ? data : [];
      setClients(safeClients);
    } catch (err) {
      console.error("Failed to load clients:", err);
      setError("Unable to load clients. Please try again later.");
      setDebugError(String(err?.message || err));
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isModeAllowed) {
    return (
      <div className="clientList">
        <Header title="Client List" showBack />
        <div className="divider" />
        <p>You are not authorized to view this client list.</p>
      </div>
    );
  }

  return (
    <div className="clientList">
      <Header title="Client List" showBack />
      <div className="divider" />

      {error && (
        <div className="error-box">
          <p>{error}</p>
          {debugError && <pre className="debug-error">{debugError}</pre>}
          <button onClick={loadClients}>Retry</button>
        </div>
      )}

      {(loading || loadingUsers) && <p>Loading clients...</p>}

      {!loading && !loadingUsers && !error && (
        <div className="clientList-page">
          <div className="clientList-content">
            <div className="client-grid">
              {clients.length === 0 ? (
                <p>No clients found.</p>
              ) : (
                clients.map((client) => (
                  <ClientCard
                    key={client.id}
                    id={client.id}
                    name={client.client_name || client.name}
                    path={mode === "contracts" ? `/contracts/${client.id}` : `/hourly/${client.id}`}
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
