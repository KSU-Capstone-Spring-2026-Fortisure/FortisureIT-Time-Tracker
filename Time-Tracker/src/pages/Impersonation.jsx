import { useMemo, useState } from "react";
import Header from "../components/Header";
import Button from "../components/Button";
import { useRole } from "../context/RoleContext";
import "../css/impersonation.css";

const SORT_ICONS = {
  asc: "\u2191",
  desc: "\u2193",
  idle: "\u2195",
};

function Impersonation() {
  const {
    users,
    loadingUsers,
    currentUser,
    canManageImpersonation,
    impersonatedUserId,
    isImpersonating,
    setImpersonation,
    clearImpersonation,
  } = useRole();
  const [sortConfig, setSortConfig] = useState({ key: "full_name", direction: "asc" });

  if (!canManageImpersonation) {
    return <div>You are not authorized to view this page.</div>;
  }

  const visibleUsers = useMemo(() => {
    const getSortValue = (user, key) => {
      switch (key) {
        case "email":
          return String(user.email || "").toLowerCase();
        case "role_name":
          return String(user.role_name || "").toLowerCase();
        case "full_name":
        default:
          return String(user.full_name || "").toLowerCase();
      }
    };

    const sortedUsers = [...users]
      .filter((user) => user.is_deleted !== true && user.is_active !== false);

    sortedUsers.sort((left, right) => {
      const comparison = getSortValue(left, sortConfig.key).localeCompare(getSortValue(right, sortConfig.key));
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sortedUsers;
  }, [sortConfig, users]);

  const toggleSort = (key) => {
    setSortConfig((current) => (
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    ));
  };

  const renderSortableHeader = (label, key) => (
    <button type="button" className="sort-header-button" onClick={() => toggleSort(key)}>
      <span>{label}</span>
      <span className="sort-header-icon">
        {sortConfig.key === key ? (sortConfig.direction === "asc" ? SORT_ICONS.asc : SORT_ICONS.desc) : SORT_ICONS.idle}
      </span>
    </button>
  );

  return (
    <div className="impersonation-page">
      <Header title="Impersonation" showBack />
      <div className="divider" />

      <div className="impersonation-panel">
        <p className="impersonation-copy">
          Choose a user to temporarily impersonate. Your admin access to this tool stays available until you undo it.
        </p>

        {isImpersonating ? (
          <div className="impersonation-actions">
            <Button variant="secondary" onClick={clearImpersonation}>Undo Impersonation</Button>
          </div>
        ) : null}

        {loadingUsers ? <p>Loading users...</p> : null}

        {!loadingUsers ? (
          <div className="impersonation-table-shell">
            <table className="impersonation-table">
              <thead>
                <tr>
                  <th>{renderSortableHeader("Name", "full_name")}</th>
                  <th>{renderSortableHeader("Email", "email")}</th>
                  <th>{renderSortableHeader("Role", "role_name")}</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => {
                  const isCurrent = String(currentUser?.id) === String(user.id);
                  const isImpersonated = String(impersonatedUserId) === String(user.id);

                  return (
                    <tr key={user.id}>
                      <td>{user.full_name}</td>
                      <td>{user.email}</td>
                      <td>{user.role_name}</td>
                      <td className="icon-cell">
                        {isCurrent && !isImpersonated ? (
                          <span className="impersonation-state">Current user</span>
                        ) : isImpersonated ? (
                          <span className="impersonation-state">Currently impersonating</span>
                        ) : (
                          <Button variant="primary" onClick={() => setImpersonation(user.id)}>
                            Impersonate
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Impersonation;
