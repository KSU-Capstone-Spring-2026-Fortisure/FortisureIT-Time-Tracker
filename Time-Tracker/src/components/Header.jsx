import { useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";
import "../css/header.css";
import logo from "../assets/logo.png";

function Header({ title, showBack = false }) {
  const navigate = useNavigate();
  const { currentUser, identityEmail, isImpersonating, impersonatorEmail, clearImpersonation } = useRole();

  const displayIdentity = currentUser?.email || identityEmail || "Unknown user";
  const identityLabel = isImpersonating && impersonatorEmail
    ? `User: ${displayIdentity} impersonated by ${impersonatorEmail}`
    : `User: ${displayIdentity}`;

  return (
    <header className="app-header">
      <div className="app-header-left">
        {showBack ? (
          <button className="back-btn" onClick={() => navigate(-1)}>
            &lt;
          </button>
        ) : null}

        <img src={logo} alt="Logo" className="logo-img" onClick={() => navigate("/")} />
      </div>

      <h1 className="app-header-title">{title}</h1>

      <div className="app-header-right">
        <span className="user-pill">{identityLabel}</span>
        {isImpersonating ? (
          <button className="undo-impersonation-btn" onClick={clearImpersonation}>
            Undo
          </button>
        ) : null}
      </div>
    </header>
  );
}

export default Header;
