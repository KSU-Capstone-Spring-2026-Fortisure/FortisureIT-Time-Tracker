import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import ProjectTracker from "./pages/ProjectTracker";
import ClientList from "./pages/ClientList";
import HourlyTracking from "./pages/HourlyTracking";
import Contracts from "./pages/Contracts";
import Milestones from "./pages/Milestones";
import BugFeatureRequest from "./pages/BugFeatureRequest";

import { initializeTeams } from "./teams";
import Documentation from "./pages/Documentation";

function App() {
  const [teamsState, setTeamsState] = useState({
    inTeams: false,
    context: null,
  });

  useEffect(() => {
    let mounted = true;

    async function setupTeams() {
      const result = await initializeTeams();

      if (!mounted) return;

      setTeamsState(result);

      if (result.inTeams && result.user) {
        await logTeamsUser(result.user);
      }
    }

    setupTeams();


    return () => {
      mounted = false;
    };
  }, []);

  return (
    <BrowserRouter>
      {/* Optional debug banner */}
      {teamsState.inTeams && (
        <div style={{ padding: "8px", background: "#eee" }}>
          Running inside Teams
        </div>
      )}

      <Routes>
        <Route index element={<ProjectTracker />} />

        {/* Client selection */}
        <Route path="clients/:mode" element={<ClientList />} />

        {/* Hourly Tracking */}
        <Route path="hourly/:clientId" element={<HourlyTracking />} />

        {/* Contracts */}
        <Route path="contracts/:clientId" element={<Contracts />} />

        {/* Milestones */}
        <Route
          path="contracts/:clientId/milestones/:contractId"
          element={<Milestones />}
        />
        {/* Bugs & Features */}
        <Route path="bugs-and-features" element={<BugFeatureRequest />} />

        {/* Documentation */}
        <Route path="documentation" element={<Documentation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;