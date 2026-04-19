import { createContext, useContext, useEffect, useState } from "react";

const RoleContext = createContext(null);

export const ROLE_OPTIONS = [
  {
    label: "Unauthorized",
    value: "unauthorized",
  },
  {
    label: "User4(Hourly)",
    value: "hourly",
  },
  {
    label: "James(Employee)",
    value: "employee",
  },
  {
    label: "User5(Contractor)",
    value: "contractor",
  },
  {
    label: "User2(Manager)",
    value: "manager",
  },
  {
    label: "Superuser6",
    value: "admin",
  },
];

export const ROLE_TO_DB_ROLE = {
  hourly: "Hourly",
  employee: "User",
  contractor: "Contract",
  manager: "Manager",
  admin: "Admin",
};

export const FEATURE_ACCESS = {
  hourly: ["hourly", "employee", "manager", "admin"],
  contracts: ["employee", "contractor", "manager", "admin"],
  reporting: ["admin", "manager"],
  bugs: ["hourly", "employee", "contractor", "manager", "admin"],
  documentation: ["hourly", "employee", "contractor", "manager", "admin"],
};

export const TEMP_ROLE_USER_IDS = {
  hourly: 7,
  employee: 3,
  contractor: 8,
  manager: 2,
  admin: 6,
};

export function getTemporaryUserId(role) {
  return TEMP_ROLE_USER_IDS[role] ?? null;
}

export function canAccessFeature(role, feature) {
  return FEATURE_ACCESS[feature]?.includes(role) ?? false;
}

export function isManagerLike(role) {
  return role === "manager" || role === "admin";
}

export function isAuthenticatedRole(role) {
  return role !== "unauthorized";
}

function normalizeStoredRole(storedRole) {
  if (!storedRole) return "unauthorized";

  const normalized = storedRole.toLowerCase();

  const validRole = ROLE_OPTIONS.find((option) => option.value === normalized);
  return validRole ? validRole.value : "unauthorized";
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