import { useRole } from "../context/RoleContext";

function RoleSelector() {
  const { role, setRole, ROLE_OPTIONS } = useRole();

  const handleChange = (e) => {
    const selectedValue = e.target.value;

    const selectedOption = ROLE_OPTIONS.find(
      (option) => option.label === selectedValue
    );

    if (selectedOption) {
      setRole(selectedOption.value); // or pass full object if you want later
      console.log("Selected option:", selectedOption);
    }
  };

  return (
    <div style={containerStyle}>
      <label htmlFor="role-select" style={{ fontSize: "14px", fontWeight: 600 }}>
        DevUserSelect
      </label>

      <select
        id="role-select"
        value={role}
        onChange={handleChange}
        style={selectStyle}
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

const containerStyle = {
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
};

const selectStyle = {
  padding: "4px 8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

export default RoleSelector;