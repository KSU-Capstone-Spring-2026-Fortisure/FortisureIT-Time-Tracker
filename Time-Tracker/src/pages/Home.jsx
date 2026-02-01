import Header from "../components/Header";
import FeatureCard from "../components/FeatureCard";
import "../css/home.css";

function Home() {
    return (
        <div className="home">
            <Header />

            <div className="divider" />
            <div className="home-page">
                <div className="home-content"></div>
                <div className="cards">
                    <FeatureCard title="Hourly Tracking" icon="⏱️"  path="/client-list"/>  {/* Ignore the emojis, also placeholders */}
                    <FeatureCard title="Reporting" icon="📈" path="/reporting"/>
                    <FeatureCard title="Contracts" icon="📄" path="/contracts" />
                    <FeatureCard title="Report Bugs & Feature Requests" icon="🐞" path="/bugs-and-features" />
                    <FeatureCard title="Documentation (Coming Soon)" icon="📘" path="/documentation"/>
                </div>
            </div>
        </div>
    );
}

export default Home;