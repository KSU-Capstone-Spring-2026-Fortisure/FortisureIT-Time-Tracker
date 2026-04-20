import Header from "../components/Header";
import FeatureCard from "../components/FeatureCard";
import "../css/projectTracker.css";
import { useRole } from "../context/RoleContext";

function ProjectTracker() {
  const { role, canAccessFeature, loadingUsers, authStatusMessage, identityEmail, identityVerified } = useRole();

  const cards = [
    canAccessFeature(role, "hourly")
      ? {
          title: "Hourly Tracking",
          icon: "\u23F1\uFE0F",
          path: "/clients/hourly",
          state: { mode: "hourly" },
        }
      : null,
    canAccessFeature(role, "reporting")
      ? {
          title: "Reporting",
          icon: "\uD83D\uDCC8",
          path: "/reporting",
        }
      : null,
    canAccessFeature(role, "contracts")
      ? {
          title: "Contracts",
          icon: "\uD83D\uDCC4",
          path: "/clients/contracts",
          state: { mode: "contracts" },
        }
      : null,
    canAccessFeature(role, "bugs")
      ? {
          title: "Report Bugs & Feature Requests",
          icon: "\uD83D\uDC1E",
          path: "/bugs-and-features",
        }
      : null,
    canAccessFeature(role, "documentation")
      ? {
          title: "Documentation (Coming Soon)",
          icon: "\uD83D\uDCD8",
          path: "/documentation",
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="projectTracker">
      <Header title="Project Tracker" />

      <div className="divider" />
      <div className="projectTracker-page">
        <div className="projectTracker-content">
          {loadingUsers ? <p>Loading user access...</p> : null}

          {!loadingUsers && authStatusMessage ? (
            <div className="error-box" style={{ marginBottom: "16px" }}>
              <p>{authStatusMessage}</p>
              {identityEmail ? <p style={{ marginTop: "8px" }}>Teams identity: {identityEmail}</p> : null}
              {!identityVerified && identityEmail ? (
                <p style={{ marginTop: "8px" }}>
                  Access remains blocked until this email exists in the users table.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="cards">
          {cards.map((card) => (
            <FeatureCard
              key={card.title}
              title={card.title}
              icon={card.icon}
              path={card.path}
              state={card.state}
            />
          ))}
        </div>

        {!loadingUsers && !authStatusMessage && cards.length === 0 ? (
          <p style={{ marginTop: "16px" }}>No features are available for your account.</p>
        ) : null}
      </div>
    </div>
  );
}

export default ProjectTracker;

