import { useState } from "react";

export default function ClaimAlertBanner({ riskLevel, onGenerateReport }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const normalizedRisk = riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase() : "Green";

  if (!["Orange", "Red"].includes(normalizedRisk)) {
    return null;
  }

  const premiumRates = [
    { label: "Kharif", value: "2%" },
    { label: "Rabi", value: "1.5%" },
    { label: "Horticulture", value: "5%" }
  ];

  return (
    <>
      <div className="claim-alert-banner">
        <div className="claim-alert-copy">
          <span className="claim-alert-badge">PMFBY</span>
          <p>
            Your crop may be eligible for PMFBY (Pradhan Mantri Fasal Bima Yojana) compensation. Report crop damage within 72 hours.
          </p>
        </div>

        <div className="claim-alert-actions">
          <button type="button" className="btn btn-secondary small" onClick={() => setIsModalOpen(true)}>
            Learn More
          </button>
          <button type="button" className="btn btn-primary small" onClick={onGenerateReport}>
            Generate Flood Evidence Report
          </button>
        </div>
      </div>

      {isModalOpen ? (
        <div className="pmfby-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="pmfby-modal" onClick={(event) => event.stopPropagation()}>
            <div className="pmfby-modal-header">
              <div>
                <div className="eyebrow">PMFBY</div>
                <h3>Insurance Advisory</h3>
              </div>
              <button type="button" className="pmfby-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="pmfby-premiums">
              {premiumRates.map((rate) => (
                <div key={rate.label} className="pmfby-rate-box">
                  <span>{rate.label}</span>
                  <strong>{rate.value}</strong>
                </div>
              ))}
            </div>

            <p className="pmfby-summary">
              Eligible farmers with notified crops in notified areas, including landowners and tenants, may receive support during adverse seasonal events.
            </p>

            <a href="https://pmfby.gov.in" target="_blank" rel="noreferrer" className="pmfby-link">
              pmfby.gov.in
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
