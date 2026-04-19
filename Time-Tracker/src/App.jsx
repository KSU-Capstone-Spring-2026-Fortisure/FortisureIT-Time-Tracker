import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

import ProjectTracker from "./pages/ProjectTracker";
import ClientList from "./pages/ClientList";
import HourlyTracking from "./pages/HourlyTracking";
import Contracts from "./pages/Contracts";
import Milestones from "./pages/Milestones";
import BugFeatureRequest from "./pages/BugFeatureRequest";
import Documentation from "./pages/Documentation";

import { initializeTeams } from "./teams";
import { RoleProvider, useRole } from "./context/RoleContext";
import RoleSelector from "./components/RoleSelector";

function ProtectedRoute({ feature, children }) {
  const { role, canAccessFeature } = useRole();

  if (!canAccessFeature(role, feature)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const [teamsState, setTeamsState] = useState({
    inTeams: false,
    context: null,
    user: null,
  });

  useEffect(() => {
    let mounted = true;

    async function setupTeams() {
      const result = await initializeTeams();

      if (!mounted) return;
      setTeamsState(result);
    }

    setupTeams();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <BrowserRouter>
      <RoleSelector />

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
