import { useNavigate } from "react-router-dom";
import "../css/featureCard.css"

function FeatureCard({ title, icon, path }) {
    const navigate = useNavigate();
    
    return (
    <div
      className="feature-card"
      onClick={() => navigate(path)}
    >
      <div className="icon">{icon}</div>
      <p>{title}</p>
    </div>
  );
}

export default FeatureCard;
