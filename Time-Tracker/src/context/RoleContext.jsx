import { createContext, useContext, useEffect, useState } from "react";

const RoleContext = createContext();

const ROLE_OPTIONS = [
  "Unauthorized",
  "Employee",
  "Contractor",
  "Manager",
  "Admin",
];

export function RoleProvider({ children }) {
  const [role, setRole] = useState(() => {
    return localStorage.getItem("devRole") || "Unauthorized";
  });

  useEffect(() => {
    localStorage.setItem("devRole", role);
  }, [role]);

  return (
    <RoleContext.Provider value={{ role, setRole, ROLE_OPTIONS }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}