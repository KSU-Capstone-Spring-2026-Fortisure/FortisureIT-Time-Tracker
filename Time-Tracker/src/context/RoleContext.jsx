import { createContext, useContext, useEffect, useState } from "react";

const RoleContext = createContext(null);

export const ROLE_OPTIONS = [
  {
    label: "Unauthorized",
    value: "Unauthorized",
  },
  {
    label: "User4(Hourly)",
    value: "Hourly",
  },
  {
    label: "James(Employee)",
    value: "Employee",
  },
  {
    label: "User5(Contractor)",
    value: "Contractor",
  },
  {
    label: "User2(Manager)",
    value: "Manager",
  },
  {
    label: "Superuser6",
    value: "Admin",
  },
];

export const ROLE_TO_DB_ROLE = {
  Hourly: "Hourly",
  Employee: "User",
  Contractor: "Contract",
  Manager: "Manager",
  Admin: "Admin",
};

export const FEATURE_ACCESS = {
  hourly: ["Hourly", "Employee", "Manager", "Admin"],
  contracts: ["Employee", "Contractor", "Manager", "Admin"],
  reporting: ["Admin", "Manager"],
  bugs: ["Hourly", "Employee", "Contractor", "Manager", "Admin"],
  documentation: ["Hourly", "Employee", "Contractor", "Manager", "Admin"],
};

export const TEMP_ROLE_USER_IDS = {
  Hourly: 7,
  Employee: 3,
  Contractor: 8,
  Manager: 2,
  Admin: 6,
};

export function getTemporaryUserId(role) {
  return TEMP_ROLE_USER_IDS[role] ?? null;
}

export function canAccessFeature(role, feature) {
  return FEATURE_ACCESS[feature]?.includes(role) ?? false;
}

export function isManagerLike(role) {
  return role === "Manager" || role === "Admin";
}

export function isAuthenticatedRole(role) {
  return role !== "Unauthorized";
}

function normalizeStoredRole(storedRole) {
  if (!storedRole) return "Unauthorized";

  const match = ROLE_OPTIONS.find(
    (option) => option.value.toLowerCase() === storedRole.toLowerCase()
  );

  return match ? match.value : "Unauthorized";
}

export function RoleProvider({ children }) {
  const [role, setRole] = useState(() => {
    const storedRole = localStorage.getItem("devRole");
    return normalizeStoredRole(storedRole);
  });

  useEffect(() => {
    localStorage.setItem("devRole", role);
  }, [role]);

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        ROLE_OPTIONS,
        ROLE_TO_DB_ROLE,
        TEMP_ROLE_USER_IDS,
        getTemporaryUserId,
        canAccessFeature,
        isManagerLike,
        isAuthenticatedRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }

  return context;
}