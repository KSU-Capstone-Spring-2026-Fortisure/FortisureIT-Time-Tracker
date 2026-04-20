import Header from "../components/Header";
import FeatureCard from "../components/FeatureCard";
import "../css/projectTracker.css";
import { useRole } from "../context/RoleContext";

function ProjectTracker() {
  const { role, canAccessFeature, loadingUsers, canManageImpersonation } = useRole();

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
    canManageImpersonation
      ? {
          title: "Impersonation",
          icon: "\uD83C\uDFAD",
          path: "/impersonation",
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

        {!loadingUsers && cards.length === 0 ? (
          <p style={{ marginTop: "16px" }}>No features are available for your account.</p>
        ) : null}
      </div>
    </div>
  );
}

export default ProjectTracker;
