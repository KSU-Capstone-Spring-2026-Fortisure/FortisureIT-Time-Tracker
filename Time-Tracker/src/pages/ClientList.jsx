import { useEffect, useState } from "react";
import Header from "../components/Header";
import ClientCard from "../components/ClientCard";
import "../css/clientList.css";
import { useParams } from "react-router-dom";

function ClientList() {
    // using this to differentiate mode sent (hourly or contracts)
    const { mode } = useParams();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const mockClients = [
            { id: 1, name: "Client A" },
            { id: 2, name: "Client B" },
            { id: 3, name: "Client C" },
            { id: 4, name: "Client D" }
        ];

        setClients(mockClients);

        // Future API
        /*
        fetch("/api/clients")
          .then(res => res.json())
          .then(data => setClients(data));
        */
    }, []);

    return (
        <div className="clientList">
            <Header title="Client List" showBack />
            <div className="divider" />

            <div className="clientList-page">
                <div className="clientList-content">
                    <div className="client-grid">
                        {clients.map(client => (
                            <ClientCard
                                key={client.id}
                                id={client.id}
                                name={client.name}
                                path={
                                    mode === "contracts"
                                        ? `/contracts/client=${client.id}`
                                        : `/hourly/client=${client.id}`
                                }
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClientList;
