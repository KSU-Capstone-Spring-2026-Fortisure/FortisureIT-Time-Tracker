import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import ClientCard from "../components/ClientCard";
import "../css/clientList.css";
import { getClients } from "../services/api";
import { useRole } from "../context/RoleContext";

const CLIENT_LIMITS = {
  Hourly: 3,
  Employee: 3,
  Contractor: 3,
  Manager: 5,
  Admin: Infinity,
};

function ClientList() {
  const { mode } = useParams();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugError, setDebugError] = useState("");
  const { role, canAccessFeature, getTemporaryUserId } = useRole();

  const isModeAllowed =
    (mode === "hourly" && canAccessFeature(role, "hourly")) ||
    (mode === "contracts" && canAccessFeature(role, "contracts"));

  const visibleClients = useMemo(() => {
    const limit = CLIENT_LIMITS[role] ?? 0;
    return clients.slice(0, Number.isFinite(limit) ? limit : clients.length);
  }, [clients, role]);

  useEffect(() => {
    if (!isModeAllowed) {
      setClients([]);
      setLoading(false);
      return;
    }

    loadClients();
  }, [isModeAllowed, mode, role]);

  const loadClients = async () => {
    setLoading(true);
    setError("");

    try {
      // Temporary static user ID until Microsoft auth is wired up.
      const viewerUserId = getTemporaryUserId(role);
      const data = await getClients({
        mode,
        viewer_role: role,
        viewer_user_id: viewerUserId,
      });

      const safeClients = Array.isArray(data) ? data : [];
      setClients(safeClients.sort((left, right) => Number(left.id) - Number(right.id)));
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

      {loading && <p>Loading clients...</p>}

      {!loading && !error && (
        <div className="clientList-page">
          <div className="clientList-content">
            <div className="client-grid">
              {visibleClients.length === 0 ? (
                <p>No clients found.</p>
              ) : (
                visibleClients.map((client) => (
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
