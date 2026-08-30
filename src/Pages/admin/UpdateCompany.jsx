import { useState, useEffect } from "react";
import "./CSS/UpdateCompany.css";
import axios from "axios";


function UpdateCompany() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

useEffect(() => {
  axios.get("http://localhost:8080/api/company")
    .then((res) => setCompanies(res.data))
    .catch(() => setError("Failed to load companies"));
}, []);

  const filtered = companies.filter((c) =>
    c.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (company) => {
    setSelected(company);
    setFormData({
      companyName:        company.companyName,
      companyEmail:       company.companyEmail,
      companyPhoneNumber: company.companyPhoneNumber,
      companyCity:        company.companyCity,
      companyAddress:     company.companyAddress
    });
    setSaved(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const response = await axios.put(
      `http://localhost:8080/api/company/${selected.companyId}`,
      formData
    );

    const updatedCompany = response.data;
    setCompanies(companies.map((c) =>
      c.companyId === updatedCompany.companyId ? updatedCompany : c
    ));
    setSelected(updatedCompany);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);

  } catch (err) {
    if (err.response) {
      setError(err.response.data); // backend's error message
    } else {
      setError("Server is not running. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="page">
      <div className="update-wrapper">

        {/* ── Left: Company Picker ── */}
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
                <div className="company-name-city">
                  <p className="company-item-name">{company.companyName}</p>
                  <p className="company-item-city">{company.companyAddress}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Edit Form ── */}
        <div className="form-card">
          {!selected ? (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No Company Selected</h3>
              <p>Pick a company from the left to edit its info</p>
            </div>
          ) : (
            <>
              <div className="form-header">
                <div className="form-icon">🏢</div>
                <div>
                  <h2>Update Company Info</h2>
                  <p>Editing: <span>{selected.companyName}</span></p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="form">

                <div className="form-row">
                  <div className="form-group">
                    <label>Company Name</label>
                    <input type="text" name="companyName"
                      value={formData.companyName} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" name="companyEmail"
                      value={formData.companyEmail} onChange={handleChange} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" name="companyPhoneNumber"
                      value={formData.companyPhoneNumber} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" name="companyCity"
                      value={formData.companyCity} onChange={handleChange} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Address</label>
                    <input type="text" name="companyAddress"
                      value={formData.companyAddress} onChange={handleChange} required />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel"
                    onClick={() => handleSelect(selected)}>
                    Reset
                  </button>
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                {saved && <div className="success-msg">✅ Company updated successfully!</div>}
                {error && <div className="error-msg">❌ {error}</div>}

              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default UpdateCompany;