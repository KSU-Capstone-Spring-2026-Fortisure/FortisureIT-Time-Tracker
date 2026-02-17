import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProjectTracker from "./pages/ProjectTracker";
import ClientList from "./pages/ClientList";
import TimeTracker from "./pages/TimeTracker";
import Contracts from "./pages/Contracts";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<ProjectTracker />} />
        <Route path="clients/:mode" element={<ClientList />} />
        <Route path="hourly/:clientId" element={<TimeTracker />} />
        <Route path="contracts/:clientId" element={<Contracts />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
