import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProjectTracker from "./pages/ProjectTracker";
import ClientList from "./pages/ClientList";
import HourlyTracking from "./pages/HourlyTracking";
import Contracts from "./pages/Contracts";
import Milestones from "./pages/Milestones";
import BugFeatureRequest from "./pages/BugFeatureRequest";

function App() {
  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;