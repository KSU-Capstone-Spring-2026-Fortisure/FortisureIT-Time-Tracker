import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuthenticatedUser, getUsers } from "../services/api";
import { initializeTeams } from "../teams";

const RoleContext = createContext(null);
const UNAUTHORIZED_VALUE = "unauthorized";

function mapDbRoleToAppRole(roleName) {
  const normalized = String(roleName || "").toLowerCase();

  switch (normalized) {
    case "hourly":
      return "Hourly";
    case "user":
      return "Employee";
    case "contract":
      return "Contractor";
    case "manager":
      return "Manager";
    case "admin":
      return "Admin";
    default:
      return "Unauthorized";
  }
}

export const FEATURE_ACCESS = {
  hourly: ["Hourly", "Employee", "Manager", "Admin"],
  contracts: ["Employee", "Contractor", "Manager", "Admin"],
  reporting: ["Admin"],
  bugs: ["Hourly", "Employee", "Contractor", "Manager", "Admin"],
  documentation: ["Hourly", "Employee", "Contractor", "Manager", "Admin"],
};

export function canAccessFeature(role, feature) {
  return FEATURE_ACCESS[feature]?.includes(role) ?? false;
}

export function isManagerLike(role) {
  return role === "Manager" || role === "Admin";
}

export function isAuthenticatedRole(role) {
  return role !== "Unauthorized";
}

function buildRoleOptions(users) {
  const devUsers = Array.isArray(users)
    ? users
        .filter((user) => user.is_deleted !== true && user.is_active !== false)
        .sort((left, right) => String(left.full_name || "").localeCompare(String(right.full_name || "")))
        .map((user) => ({
          label: `${user.full_name} (${mapDbRoleToAppRole(user.role_name)})`,
          value: String(user.id),
        }))
    : [];

  return [
    { label: "Unauthorized", value: UNAUTHORIZED_VALUE },
    ...devUsers,
  ];
}

function normalizeStoredUserId(storedUserId, users) {
  if (!storedUserId || storedUserId === UNAUTHORIZED_VALUE) {
    return UNAUTHORIZED_VALUE;
  }

  return users.some((user) => String(user.id) === String(storedUserId))
    ? String(storedUserId)
    : UNAUTHORIZED_VALUE;
}

export function RoleProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserIdState] = useState(() => {
    return localStorage.getItem("devUserId") || UNAUTHORIZED_VALUE;
  });
  const [teamsState, setTeamsState] = useState({
    inTeams: false,
    context: null,
    user: null,
    authToken: null,
    authError: null,
  });
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [identityEmail, setIdentityEmail] = useState("");
  const [identityMode, setIdentityMode] = useState(null);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [authStatusMessage, setAuthStatusMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadAccessContext() {
      setLoadingUsers(true);

      try {
        const teamsResult = await initializeTeams();
        if (!mounted) return;

        setTeamsState(teamsResult);

        const usersData = await getUsers();
        if (!mounted) return;
        setUsers(Array.isArray(usersData) ? usersData : []);

        const loginHint = String(
          teamsResult?.user?.loginHint || teamsResult?.user?.userPrincipalName || ""
        )
          .trim()
          .toLowerCase();

        if (teamsResult.inTeams && (teamsResult.authToken || loginHint)) {
          try {
            const authResult = await getAuthenticatedUser({
              authToken: teamsResult.authToken,
              loginHint,
            });

            if (!mounted) return;

            setAuthenticatedUser(authResult?.user || null);
            setIdentityEmail(String(authResult?.identity_email || loginHint || "").trim().toLowerCase());
            setIdentityMode(authResult?.auth_mode || null);
            setIdentityVerified(Boolean(authResult?.verified));
            setAuthStatusMessage(
              authResult?.verified
                ? ""
                : authResult?.user
                  ? "Teams SDK email is being used as the temporary trusted sign-in source until verified Teams SSO is configured."
                  : ""
            );
          } catch (error) {
            if (!mounted) return;

            setAuthenticatedUser(null);
            setIdentityEmail(loginHint);
            setIdentityMode(null);
            setIdentityVerified(false);
            setAuthStatusMessage(
              String(error?.message || "You do not have access to this app. Please contact your administrator.")
            );
          }
        } else if (teamsResult.inTeams && teamsResult.authError) {
          setAuthStatusMessage("Teams launched the app, but the SDK did not provide a usable email identity.");
        } else {
          setAuthStatusMessage("");
        }
      } catch (error) {
        console.error("Failed to load role context:", error);
        if (!mounted) return;
        setUsers([]);
        setAuthStatusMessage(String(error?.message || "Unable to load user access."));
      } finally {
        if (mounted) {
          setLoadingUsers(false);
        }
      }
    }

    loadAccessContext();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loadingUsers) return;

    const normalizedUserId = normalizeStoredUserId(selectedUserId, users);
    if (normalizedUserId !== selectedUserId) {
      setSelectedUserIdState(normalizedUserId);
      localStorage.setItem("devUserId", normalizedUserId);
    }
  }, [loadingUsers, selectedUserId, users]);

  const devCurrentUser = useMemo(() => {
    if (selectedUserId === UNAUTHORIZED_VALUE) {
      return null;
    }

    return users.find((user) => String(user.id) === String(selectedUserId)) || null;
  }, [selectedUserId, users]);

  const currentUser = authenticatedUser || devCurrentUser;
  const role = useMemo(() => mapDbRoleToAppRole(currentUser?.role_name), [currentUser?.role_name]);
  const ROLE_OPTIONS = useMemo(() => buildRoleOptions(users), [users]);
  const managedUserIds = useMemo(() => {
    if (!currentUser) return [];

    return users
      .filter((user) => String(user.manager_user_id) === String(currentUser.id))
      .map((user) => user.id);
  }, [currentUser, users]);

  const setCurrentUserId = (userId) => {
    const normalized = String(userId || UNAUTHORIZED_VALUE);
    setSelectedUserIdState(normalized);
    localStorage.setItem("devUserId", normalized);
  };

  const canUseDevUserSwitching = !authenticatedUser;

  return (
    <RoleContext.Provider
      value={{
        role,
        users,
        currentUser,
        currentUserId: currentUser?.id ?? null,
        managedUserIds,
        loadingUsers,
        selectedUserId,
        setCurrentUserId,
        ROLE_OPTIONS,
        canUseDevUserSwitching,
        canAccessFeature,
        isManagerLike,
        isAuthenticatedRole,
        teamsState,
        identityEmail,
        identityMode,
        identityVerified,
        authStatusMessage,
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

