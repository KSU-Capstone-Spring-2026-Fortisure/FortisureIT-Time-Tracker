import { useRole } from "../context/RoleContext";

function RoleSelector() {
  const { loadingUsers, selectedUserId, setCurrentUserId, ROLE_OPTIONS, canUseDevUserSwitching } = useRole();

  if (!canUseDevUserSwitching) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "12px",
        right: "12px",
        zIndex: 9999,
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "8px 12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <label htmlFor="role-select" style={{ fontSize: "14px", fontWeight: 600 }}>
        DevUserSelect
      </label>

      <select
        id="role-select"
        value={selectedUserId}
        onChange={(e) => setCurrentUserId(e.target.value)}
        disabled={loadingUsers}
        style={{
          padding: "4px 8px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default RoleSelector;
