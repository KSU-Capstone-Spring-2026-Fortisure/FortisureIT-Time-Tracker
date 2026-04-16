import Header from "../components/Header";
import FeatureCard from "../components/FeatureCard";
import "../css/projectTracker.css";
import { useRole } from "../context/RoleContext";

function ProjectTracker() {
  return (
    <div className="projectTracker">
      <Header title="Project Tracker" />

      <div className="divider" />
      <div className="projectTracker-page">
        <div className="projectTracker-content"></div>

        <div className="cards">
          <FeatureCard
            title="Hourly Tracking"
            icon="⏱️"
            path="/clients/hourly"
            state={{ mode: "hourly" }}
          />

          <FeatureCard
            title="Reporting"
            icon="📈"
            path="/reporting"
          />

          <FeatureCard
            title="Contracts"
            icon="📄"
            path="/clients/contracts"
            state={{ mode: "contracts" }}
          />

          <FeatureCard
            title="Report Bugs & Feature Requests"
            icon="🐞"
            path="/bugs-and-features"
          />

          <FeatureCard
            title="Documentation (Coming Soon)"
            icon="📘"
            path="/documentation"
          />
        </div>
      </div>
    </div>
  );
}

export default ProjectTracker;