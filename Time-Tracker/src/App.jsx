import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import ProjectTracker from "./pages/ProjectTracker";
import ClientList from "./pages/ClientList";
import HourlyTracking from "./pages/HourlyTracking";
import Contracts from "./pages/Contracts";
import Milestones from "./pages/Milestones";
import BugFeatureRequest from "./pages/BugFeatureRequest";

import { initializeTeams } from "./teams";
import { RoleProvider } from "./context/RoleContext";
import RoleSelector from "./components/RoleSelector";

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

        <Route path="hourly/:clientId" element={<HourlyTracking />} />

        <Route path="contracts/:clientId" element={<Contracts />} />

        <Route
          path="contracts/:clientId/milestones/:contractId"
          element={<Milestones />}
        />

        <Route path="bugs-and-features" element={<BugFeatureRequest />} />

        <Route path="documentation" element={<Documentation />} />
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