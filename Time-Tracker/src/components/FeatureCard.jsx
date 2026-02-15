import { useNavigate } from "react-router-dom";
import "../css/featureCard.css"

function FeatureCard({ title, icon, path, state }) {
  const navigate = useNavigate();

  return (
    <div className="feature-card" onClick={() => navigate(path, { state })} >
      <div className="icon">{icon}</div>
      <p>{title}</p>
    </div>
  );
}

export default FeatureCard;
