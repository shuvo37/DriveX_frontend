import { useState, useEffect } from "react";
import axios from "axios";
import "./CSS/CompanyActiveStatus.css";

const statusColors = {
  active:     { border: "#52b788", color: "#52b788", bg: "#1a3a2a", dot: "#52b788" },
  not_active: { border: "#8b0616", color: "#ebeae7", bg: "#69070f", dot: "#f30505" },
};

function CompanyActiveStatus() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:8080/api/company/compayThatAllCarInMaintainance")
      .then((res) => setCompanies(res.data))
      .catch(() => setError("Failed to load companies"));
  }, []);

  const filtered = companies.filter((c) =>
    c.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (company) => {
    setSelected(company);
    setSaved(false);
    setError("");
  };

  const handleToggleActive = async () => {
    setUpdating(true);
    setError("");

    try {
      const payload = {
        companyName: selected.companyName,
        isActive: !selected.isActive,
      };

      const response = await axios.patch(
        "http://localhost:8080/api/company/company-active-status-update",
        payload
      );

      const updatedCompany = { ...selected, ...response.data.Company };

      setCompanies((prev) =>
        prev.map((c) =>
          c.companyId === updatedCompany.companyId ? updatedCompany : c
        )
      );
      setSelected(updatedCompany);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

    } catch (err) {
      if (err.response) {
        const data = err.response.data;
        setError(typeof data === "string" ? data : JSON.stringify(data));
      } else {
        setError("Server is not running. Please try again.");
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="page">
      <div className="delete-wrapper">

        {/* ── Left: Company List ── */}
        <div className="company-list-card">
          <h3>Select Company</h3>
          <input
            className="search-input"
            type="text"
            placeholder="Search company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered.length > 0) {
                handleSelect(filtered[0]);
              }
            }}
          />
          <div className="company-list">
            {filtered.length === 0 && (
              <p className="no-result">No companies found</p>
            )}
            {filtered.map((company) => (
              <div
                key={company.companyId}
                className={`company-item ${selected?.companyId === company.companyId ? "active" : ""}`}
                onClick={() => handleSelect(company)}
              >
                <div className="company-avatar">
                  {company.companyName.charAt(0)}
                </div>
                <div className="company-item-info">
                  <p className="company-item-name">{company.companyName}</p>
                  <p className="company-item-city">{company.companyAddress}</p>
                </div>

                <span
                  className="company-status-badge"
                  style={{
                    color: statusColors[company.isActive ? "active" : "not_active"].color,
                    backgroundColor: statusColors[company.isActive ? "active" : "not_active"].bg,
                    border: `1px solid ${statusColors[company.isActive ? "active" : "not_active"].border}40`,
                  }}
                >
                  <span
                    className="status-dot"
                    style={{ backgroundColor: statusColors[company.isActive ? "active" : "not_active"].dot }}
                  ></span>
                  {company.isActive ? "active" : "not active"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Active Status Panel ── */}
        <div className="form-card">

          {error && <div className="error-msg">❌ {error}</div>}

          {!selected && (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No Company Selected</h3>
              <p>Pick a company from the left to view its status</p>
            </div>
          )}

          {selected && (
            <>
              <div className="form-header">
                <div className="form-icon">🏢</div>
                <div>
                  <h2>Company Status</h2>
                  <p>Viewing: <span className="highlight">{selected.companyName}</span></p>
                </div>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Company Name</span>
                  <span className="info-value">{selected.companyName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{selected.companyEmail}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{selected.companyPhoneNumber}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">City</span>
                  <span className="info-value">{selected.companyCity}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Country</span>
                  <span className="info-value">{selected.companyCountry}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Address</span>
                  <span className="info-value">{selected.companyAddress}</span>
                </div>
              </div>

              <div className="active-toggle-box">
                <div>
                  <p className="toggle-label">Active Status</p>
                  <p className="toggle-sublabel">
                    {selected.isActive ? "This company is visible to customers" : "This company is hidden from customers"}
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={selected.isActive}
                    onChange={handleToggleActive}
                    disabled={updating}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {saved && <div className="deleted-msg">✅ Status updated successfully!</div>}

            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default CompanyActiveStatus;