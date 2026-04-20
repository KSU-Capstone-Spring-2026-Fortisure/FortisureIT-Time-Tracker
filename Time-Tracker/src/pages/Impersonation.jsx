import Header from "../components/Header";
import Button from "../components/Button";
import { useRole } from "../context/RoleContext";

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

  if (!canManageImpersonation) {
    return <div>You are not authorized to view this page.</div>;
  }

  const visibleUsers = [...users]
    .filter((user) => user.is_deleted !== true && user.is_active !== false)
    .sort((left, right) => String(left.full_name || "").localeCompare(String(right.full_name || "")));

  return (
    <div style={{ paddingBottom: "24px" }}>
      <Header title="Impersonation" showBack />
      <div className="divider" />

      <div style={{ padding: "16px 24px" }}>
        <p style={{ marginBottom: "16px" }}>
          Choose a user to temporarily impersonate. Your admin access to this tool stays available until you undo it.
        </p>

        {isImpersonating ? (
          <div style={{ marginBottom: "16px" }}>
            <Button variant="secondary" onClick={clearImpersonation}>Undo Impersonation</Button>
          </div>
        ) : null}

        {loadingUsers ? <p>Loading users...</p> : null}

        {!loadingUsers ? (
          <div style={{ border: "1px solid #d1d5db", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f9fafb" }}>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px" }}>Name</th>
                  <th style={{ textAlign: "left", padding: "12px" }}>Email</th>
                  <th style={{ textAlign: "left", padding: "12px" }}>Role</th>
                  <th style={{ textAlign: "left", padding: "12px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => {
                  const isCurrent = String(currentUser?.id) === String(user.id);
                  const isImpersonated = String(impersonatedUserId) === String(user.id);

                  return (
                    <tr key={user.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px" }}>{user.full_name}</td>
                      <td style={{ padding: "12px" }}>{user.email}</td>
                      <td style={{ padding: "12px" }}>{user.role_name}</td>
                      <td style={{ padding: "12px" }}>
                        {isCurrent && !isImpersonated ? (
                          <span>Current user</span>
                        ) : isImpersonated ? (
                          <span>Currently impersonating</span>
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
