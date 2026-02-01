import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/NavBar";
import Home from "./pages/Home";
import ClientList from "./pages/ClientList";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
         <Route path="/client-list" element={<ClientList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
