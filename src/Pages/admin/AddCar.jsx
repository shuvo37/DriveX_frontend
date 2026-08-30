import { useState, useEffect } from "react";
import "./CSS/AddCar.css";
import axios from "axios";

function AddCar() {

  const [formData, setFormData] = useState({
    modelName: "",
    pricePerHour: "",
    rentalStatus: "maintenance",
    seats: "",
    fuel: "PETROL",
    tag: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [companies, setCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompanyName , setSelectedCompanyName] = useState("")
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/api/company")
      .then((res) => res.json())
      .then((data) => setCompanies(data))
      .catch(() => setError("Failed to load companies"));
  }, []);

  const filteredCompanies = companies.filter((c) =>
    c.companyName.toLowerCase().includes(companySearch.toLowerCase())
  );


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };
 


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors({ ...errors, image: "" });
    }
  };


  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
  };



  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setCompanySearch(company.companyName);
    setSelectedCompanyName(company.companyName);
    setShowDropdown(false);
    setErrors({ ...errors, company: "" });
  };




  const validate = () => {
    const newErrors = {};
    if (!formData.modelName.trim()) newErrors.modelName = "Model name is required";
    if (!formData.pricePerHour || formData.pricePerHour <= 0)
      newErrors.pricePerHour = "Enter a valid price";
    if (!formData.seats || formData.seats <= 0)
      newErrors.seats = "Enter a valid seat count";
    if (!selectedCompany) newErrors.company = "Please select a valid company";
    if (!imageFile) newErrors.image = "Please upload a car image";
    return newErrors;
  };

  const getImageUrl = async (file) =>
  {
      const formData = new FormData();

      formData.append("file" , file);

      const response = await axios.post("http://localhost:8080/api/images/upload"  , formData);


     return response.data;

  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setError("");

    try {

     let imageUrl = "";

     if(imageFile)
     {

        imageUrl = await getImageUrl(imageFile);

     }

        const carPayload = {
        companyName: selectedCompanyName,
        modelName: formData.modelName,
        pricePerHour: formData.pricePerHour,
        rentalStatus: formData.rentalStatus.toUpperCase(),
        seats: formData.seats,
        fuel: formData.fuel,
        imageUrl: imageUrl,
        tag: formData.tag,
        };     

        const response = await axios.post("http://localhost:8080/api/car", carPayload);

        setSubmitted(true);
        setFormData({ modelName: "", pricePerHour: "", rentalStatus: "available", seats: "", fuel: "PETROL", tag: "" });
        setSelectedCompany(null);
        setCompanySearch("");
        setImageFile(null);
        setImagePreview(null);
        setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
  if (err.response) {
    const data = err.response.data;
    setError(typeof data === "string" ? data : JSON.stringify(data));
  } else {
    setError("Server is not running. Please try again.");
  }
} finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ modelName: "", pricePerHour: "", rentalStatus: "available", seats: "", fuel: "PETROL", tag: "" });
    setSelectedCompany(null);
    setCompanySearch("");
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
    setSubmitted(false);
    setError("");
  };

  const fuelOptions = ["PETROL", "DIESEL", "HYBRID", "ELECTRICITY"];
  const fuelEmoji   = { PETROL: "⛽", DIESEL: "🛢️", HYBRID: "🔋", ELECTRICITY: "⚡" };
  const tagOptions = ["SUV", "Luxury", "Family", "Sports", "Economy", "Convertible", "Van", "Truck"];
  const rentalStatus = ["available", "rented", "maintenance"];

  return (
    <div className="page">
      <div className="form-card">

        <div className="form-header">
          <div className="form-icon">🚗</div>
          <div>
            <h2>Add New Car</h2>
            <p>Fill in the details to register a new car</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form">

          {/* Row 1 — Model Name + Price */}
          <div className="form-row">
            <div className="form-group">
              <label>Model Name</label>
              <input
                type="text"
                name="modelName"
                placeholder="e.g. Toyota Camry"
                value={formData.modelName}
                onChange={handleChange}
              />
              {errors.modelName && <span className="error">{errors.modelName}</span>}
            </div>

            <div className="form-group">
              <label>Price Per Hour ($)</label>
              <input
                type="number"
                name="pricePerHour"
                placeholder="e.g. 25"
                min="0"
                value={formData.pricePerHour}
                onChange={handleChange}
              />
              {errors.pricePerHour && <span className="error">{errors.pricePerHour}</span>}
            </div>
          </div>

          {/* Row 2 — Seats + Tag */}

<div className="form-row">
  <div className="form-group">
    <label>Seats</label>
    <input
      type="number"
      name="seats"
      placeholder="e.g. 5"
      min="1"
      max="20"
      value={formData.seats}
      onChange={handleChange}
    />
    {errors.seats && <span className="error">{errors.seats}</span>}
  </div>
</div>

{/* Tag — full width row */}
<div className="form-group">
  <label>Tag <span className="optional">(optional)</span></label>
  <div className="tag-options">
    {tagOptions.map((t) => (
      <button
        type="button"
        key={t}
        className={`tag-btn ${formData.tag === t ? "tag-active" : ""}`}
        onClick={() =>
          setFormData({ ...formData, tag: formData.tag === t ? "" : t })
        }
      >
        {t}
      </button>
    ))}
  </div>
</div>


          {/* Row 3 — Rental Status + Company */}
          <div className="form-row">
            <div className="form-group">
              <label>Rental Status</label>
              <div className="status-options">
                {rentalStatus.map((status) => (
                  <button
                    type="button"
                    key={status}
                    className={`status-btn ${formData.rentalStatus === status ? `status-active-${status}` : ""}`}
                    onClick={() => setFormData({ ...formData, rentalStatus: status })}
                  >
                    <span className={`status-dot dot-${status}`}></span>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ position: "relative" }}>
              <label>Company</label>
              <input
                type="text"
                placeholder="Search company..."
                value={companySearch}
                onChange={(e) => {
                  setCompanySearch(e.target.value);
                  setSelectedCompany(null);
                  setShowDropdown(true);
                  setErrors({ ...errors, company: "" });
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                className={selectedCompany ? "input-verified" : ""}
              />
              {selectedCompany && <span className="verified-badge">✔ Verified</span>}
              {errors.company && <span className="error">{errors.company}</span>}

              {showDropdown && companySearch && (
                <div className="company-dropdown">
                  {filteredCompanies.length === 0 ? (
                    <div className="dropdown-empty">No companies found</div>
                  ) : (
                    filteredCompanies.map((company) => (
                      <div
                        key={company.companyId}
                        className="dropdown-item"
                        onMouseDown={() => handleCompanySelect(company)}
                      >
                        <div className="dropdown-avatar">{company.companyName.charAt(0)}</div>
                        <div>
                          <p className="dropdown-name">{company.companyName}</p>
                          <p className="dropdown-city">{company.companyAddress}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {selectedCompany && (
            <div className="company-preview">
              <div className="preview-avatar">{selectedCompany.companyName.charAt(0)}</div>
              <div>
                <p className="preview-name">{selectedCompany.companyName}</p>
                <p className="preview-city">{selectedCompany.companyAddress}</p>
              </div>
              <button
                type="button"
                className="preview-remove"
                onClick={() => { setSelectedCompany(null); setCompanySearch(""); }}
              >✕</button>
            </div>
          )}

          {/* Fuel Type */}
          <div className="form-group">
            <label>Fuel Type</label>
            <div className="fuel-options">
              {fuelOptions.map((fuel) => (
                <button
                  type="button"
                  key={fuel}
                  className={`fuel-btn ${formData.fuel === fuel ? "fuel-active" : ""}`}
                  onClick={() => setFormData({ ...formData, fuel })}
                >
                  {fuelEmoji[fuel]} {fuel.charAt(0) + fuel.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label>Car Image</label>
            {!imagePreview ? (
              <label className="image-upload-area">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
                <div className="upload-placeholder">
                  <span className="upload-icon">📷</span>
                  <p>Click to upload JPG/PNG</p>
                </div>
              </label>
            ) : (
              <div className="image-preview-wrapper">
                <img src={imagePreview} alt="Car preview" className="image-preview" />
                <button type="button" className="image-remove-btn" onClick={handleImageRemove}>
                  ✕ Remove
                </button>
              </div>
            )}
            {errors.image && <span className="error">{errors.image}</span>}
          </div>



          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleClear}>Clear</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Adding..." : "Add Car"}
            </button>
          </div>

          {submitted && <div className="success-msg">✅ Car added successfully!</div>}
          {error     && <div className="error-msg">❌ {error}</div>}

        </form>
      </div>
    </div>
  );
}

export default AddCar;