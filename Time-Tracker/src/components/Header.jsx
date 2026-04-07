import { useNavigate } from "react-router-dom";
import "../css/header.css";
import logo from "../assets/logo.png";
import ProjectTracker from "../pages/ProjectTracker";

function Header({ title, showBack = false }) {
  const navigate = useNavigate();

  return (
    <header className="header">

      {/* Left side */}
      <div className="left-section">
        {showBack && (
          <button className="back-btn" onClick={() => navigate(-1)}>
            ←
          </button>
        )}

        <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate("/")} />
      </div>

      {/* Center title */}
      <h1 className="header-title">{title}</h1>
    </header>
  );
}

export default Header;