import { useNavigate } from "react-router-dom";
import "../css/clientCard.css";

function ClientCard({ id, name, logo, path }) {
    const navigate = useNavigate();

    return (
        <div className="client-card" onClick={() => navigate(path || `/clients/${id}`)} >
            <div className="client-left">
                <img
                    src={logo || "/logo.png"}
                    alt={name}
                    className="client-logo"
                />
                <span className="client-name">{name}</span>
            </div>

            <span className="arrow">{">"}</span>
        </div>
    );
}

export default ClientCard;
