import Header from "../components/Header";

function Reporting() {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f4f4" }}>
      <Header title="Reporting" showBack />
      <div className="divider" />

      <div style={{ padding: "40px 24px" }}>
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Sorry, this feature is not yet implemented.</h2>
          <p>Reporting is still in progress. Please use the back button to return to the main dashboard.</p>
        </div>
      </div>
    </div>
  );
}

export default Reporting;
