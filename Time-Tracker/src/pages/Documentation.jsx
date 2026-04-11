import Header from "../components/Header";
import "../css/documentation.css";

function Documentation() {
  return (
    <div className="doc-wrapper">
      <Header title="User Guide" showBack />

      <div className="doc-page">
        <div className="doc-container">

          <h2>Welcome to the Time Tracker</h2>
          <p>
            This guide explains how to use the Time Tracker to log hours, manage contracts,
            submit bugs and feature requests, and view reports.
          </p>

          {/* HOURLY ENTRIES */}
          <div className="doc-section">
            <h3>Hourly Entries</h3>
            <p>Use this section to log your daily work.</p>
            <ul>
              <li><strong>Add Entry:</strong> Log hours worked for a specific date and task.</li>
              <li><strong>Edit Entry:</strong> Update existing entries using the <strong>Edit</strong> button.</li>
              <li><strong>View Entry:</strong> Open an entry in read-only mode using the <strong>View</strong> button.</li>
              <li><strong>Delete Entry:</strong> Remove an entry using the <strong>Delete</strong> button.</li>
              <li><strong>Submit Time:</strong> Finalize entries for a period. </li>
              <li><strong>Status:</strong> Submitted entries may be locked from editing.</li>
            </ul>
          </div>

          {/* CONTRACTS */}
          <div className="doc-section">
            <h3>Contracts</h3>
            <p>
              Contracts define the clients or projects you work under. Each contract may include
              milestones that break the work into phases and help organize billing and progress tracking.
            </p>

            <ul>
              <li>
                <strong>View Contracts:</strong> Browse all active and inactive contracts assigned to you.
              </li>

              <li>
                <strong>Contract Details:</strong> Each contract displays the client name, billing type
                (hourly, fixed, or non‑billable), start and end dates, and any additional notes.
              </li>

              <li>
                <strong>Milestones:</strong> Contracts can contain milestones representing major
                deliverables or phases. Milestones help track progress and organize work within the
                contract.
              </li>

              <li>
                <strong>Selecting a Contract:</strong> When logging hours, you choose the contract the
                work applies to so billing and reporting remain accurate.
              </li>
            </ul>
          </div>


          {/* BUGS & FEATURE REQUESTS */}
          <div className="doc-section">
            <h3>Bugs & Feature Requests</h3>
            <p>Use this page to report issues or request improvements.</p>
            <ul>
              <li><strong>Add Request:</strong> Submit a bug or feature with title, severity, and description.</li>
              <li><strong>Edit Request:</strong> Update details using the <strong>Edit</strong> button.</li>
              <li><strong>Mark Complete:</strong> Close a request using the <strong>Complete</strong> button.</li>
            </ul>
          </div>

          {/* REPORTING */}
          <div className="doc-section">
            <h3>Reporting</h3>
            <p>
              Reporting integrates with Power BI to visualize your time, productivity, and contract usage.
            </p>
            <ul>
              <li><strong>Open Reports:</strong> Navigate to the Reporting page.</li>
              <li><strong>Power BI Dashboard:</strong> Displays charts, totals, and trends.</li>
              <li><strong>Filters:</strong> Filter by date range, contract, or status.</li>
              <li><strong>Export:</strong> Power BI allows exporting visuals or data as needed.</li>
            </ul>
          </div>

          {/* HELP */}
          <div className="doc-section">
            <h3>Need Help?</h3>
            <p>
              Contact your administrator if something doesn't behave as expected.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Documentation;