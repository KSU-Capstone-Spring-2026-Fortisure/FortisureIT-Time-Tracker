import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

import ProjectTracker from "./pages/ProjectTracker";
import ClientList from "./pages/ClientList";
import HourlyTracking from "./pages/HourlyTracking";
import Contracts from "./pages/Contracts";
import Milestones from "./pages/Milestones";
import BugFeatureRequest from "./pages/BugFeatureRequest";
import Documentation from "./pages/Documentation";
import Impersonation from "./pages/Impersonation";

import { initializeTeams } from "./teams";
import { getUiConfig } from "./services/api";
import { RoleProvider, useRole } from "./context/RoleContext";
import RoleSelector from "./components/RoleSelector";

function ProtectedRoute({ feature, children }) {
  const { role, canAccessFeature, loadingUsers } = useRole();

  if (loadingUsers) {
    return <p>Loading user access...</p>;
  }

  if (!canAccessFeature(role, feature)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AdminToolsRoute({ children }) {
  const { canManageImpersonation, loadingUsers } = useRole();

  if (loadingUsers) {
    return <p>Loading user access...</p>;
  }

  if (!canManageImpersonation) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const [uiConfig, setUiConfig] = useState({
    showDevUserSwitcher: false,
  });

  useEffect(() => {
    let mounted = true;

    async function setupApp() {
      try {
        await initializeTeams();
        const uiConfigResult = await getUiConfig();

        if (!mounted) return;
        setUiConfig((current) => ({ ...current, ...(uiConfigResult || {}) }));
      } catch (error) {
        console.error("Failed to load app config:", error);
      }
    }

    setupApp();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <BrowserRouter>
      {uiConfig.showDevUserSwitcher ? <RoleSelector /> : null}

      <Routes>
        <Route index element={<ProjectTracker />} />
        <Route path="clients/:mode" element={<ClientList />} />
        <Route
          path="hourly/:clientId"
          element={
            <ProtectedRoute feature="hourly">
              <HourlyTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="contracts/:clientId"
          element={
            <ProtectedRoute feature="contracts">
              <Contracts />
            </ProtectedRoute>
          }
        />
        <Route
          path="contracts/:clientId/milestones/:contractId"
          element={
            <ProtectedRoute feature="contracts">
              <Milestones />
            </ProtectedRoute>
          }
        />
        <Route
          path="impersonation"
          element={
            <AdminToolsRoute>
              <Impersonation />
            </AdminToolsRoute>
          }
        />
        <Route
          path="documentation"
          element={
            <ProtectedRoute feature="documentation">
              <Documentation />
            </ProtectedRoute>
          }
        />
        <Route
          path="bugs-and-features"
          element={
            <ProtectedRoute feature="bugs">
              <BugFeatureRequest />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <RoleProvider>
      <AppContent />
    </RoleProvider>
  );
}

export default App;
