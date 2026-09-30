export default function AdvisoryBox({ loading, advisory, activeTab, setActiveTab }) {
  return (
    <div className="panel advisory-panel">
      <div className="advisory-header-row">
        <div className="tab-row">
          <button className={`tab-btn ${activeTab === "farmer" ? "active" : ""}`} onClick={() => setActiveTab("farmer")}>Farmer Advice</button>
          <button className={`tab-btn ${activeTab === "general" ? "active" : ""}`} onClick={() => setActiveTab("general")}>General Advice</button>
        </div>

        <div className="pmfby-info-card">
          <div className="pmfby-info-label">PMFBY Info</div>
          <p>Crop insurance support for notified crops and areas under PMFBY.</p>
          <ul>
            <li>Land ownership or tenancy</li>
            <li>Notified crop</li>
            <li>Notified area</li>
          </ul>
        </div>
      </div>

      {loading ? <div className="spinner-box"><div className="spinner" /></div> : <p className="advisory-text">{advisory || "Click Get AI Advisory to generate guidance."}</p>}
    </div>
  );
}
