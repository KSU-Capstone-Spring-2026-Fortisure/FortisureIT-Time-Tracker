import { createContext, useContext, useEffect, useState } from "react";

const RoleContext = createContext();

export const ROLE_OPTIONS = [
  "Unauthorized",
  "Hourly",
  "Employee",
  "Contractor",
  "Manager",
  "Admin",
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
  reporting: ["Admin"],
  bugs: ["Hourly", "Employee", "Contractor", "Manager", "Admin"],
  documentation: ["Hourly", "Employee", "Contractor", "Manager", "Admin"],
};

// Temporary static user IDs until Microsoft auth is wired up.
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

export function RoleProvider({ children }) {
  const [role, setRole] = useState(() => {
    return localStorage.getItem("devRole") || "Unauthorized";
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
  return useContext(RoleContext);
}
