import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProjectTracker from "./pages/ProjectTracker";
import ClientList from "./pages/ClientList";
import TimeTracker from "./pages/TimeTracker";
import Contracts from "./pages/Contracts";
import Milestones from "./pages/Milestones";
import BugFeatureRequest from "./pages/BugFeatureRequest";
import MilestoneForm from "./pages/shared/MilestoneForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<ProjectTracker />} />
        <Route path="clients/:mode" element={<ClientList />} />
        <Route path="hourly/:clientId" element={<TimeTracker />} />
        <Route path="contracts/:clientId" element={<Contracts />} />
        <Route path="contracts/:clientId/milestones/:contractId" element={<Milestones />} />
        <Route path="contracts/:clientId/milestones/:contractId/add" element={<MilestoneForm />} />
        <Route path="contracts/:clientId/milestones/:contractId/edit/:milestoneId" element={<MilestoneForm />} />
        <Route path="bugs-and-features" element={<BugFeatureRequest />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;