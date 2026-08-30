import { useState, useEffect } from "react";
import "./CSS/UpdateCar.css";
import axios from "axios";

const statusColors = {
  available:   { border: "#52b788", color: "#52b788", bg: "#1a3a2a", dot: "#52b788" },
  rented:      { border: "#6366f1", color: "#a5b4fc", bg: "#1e1e3a", dot: "#6366f1" },
  maintenance: { border: "#f59e0b", color: "#fcd34d", bg: "#2a2010", dot: "#f59e0b" },
};

const fuelOptions = ["PETROL", "DIESEL", "HYBRID", "ELECTRICITY"];
const fuelEmoji   = { PETROL: "⛽", DIESEL: "🛢️", HYBRID: "🔋", ELECTRICITY: "⚡" };
const tagOptions  = ["SUV", "Luxury", "Family", "Sports", "Economy", "Convertible", "Van", "Truck"];
const rentalStatus = ["available", "rented", "maintenance"];

function UpdateCar() {
  const [cars, setCars] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedCompanyName , setSelectedCompanyName] = useState("");
  const [selectedModelName , setSelectedModelName] = useState("");
  const [formData, setFormData] = useState({});
  const [formData1, setFormData1] = useState({});
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);           
  const [imagePreview, setImagePreview] = useState(null);  
  const[cannotChange , setCannotChange]  = useState(false);

  useEffect(() => {
    axios.get("http://localhost:8080/api/car")
    .then((res) => setCars(res.data))
    .catch(() => setError("Failed to load companies"));

    axios.get("http://localhost:8080/api/company")
    .then((res) => setCompanies(res.data))
    .catch(() => setError("Failed to load companies"));

  }, []);

  console.log(cars);
  console.log(companies);

  const filteredCars = cars.filter((c) =>
    c.modelName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCompanies = companies.filter((c) =>
    c.companyName.toLowerCase().includes(companySearch.toLowerCase())
  );

  const handleSelectCar = (car) => {

    setCannotChange(car.rentalStatus.toUpperCase() !== "MAINTENANCE");

    setSelected(car);
    setFormData({
      pricePerHour: car.pricePerHour,
      rentalStatus: car.rentalStatus.toLowerCase(),
      seats: car.seats || "",
      fuel:  car.fuel  || "PETROL",
      tag:   car.tag   || "",
    });

    setFormData1({
      pricePerHour: car.pricePerHour,
      rentalStatus: car.rentalStatus.toLowerCase(),
      seats: car.seats || "",
      fuel:  car.fuel  || "PETROL",
      tag:   car.tag   || "",
    });
    setSelectedCompany(car.company);
    setCompanySearch(car.company.companyName);
    setSelectedCompanyName(car.company.companyName);
    setSelectedModelName(car.modelName);
    setImageFile(null);
    setImagePreview(car.imageUrl); 
    setSaved(false);
    setErrors({});
    setError("");
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setCompanySearch(company.companyName);
    setShowDropdown(false);
    setErrors({ ...errors, company: "" });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.pricePerHour || formData.pricePerHour <= 0)
      newErrors.pricePerHour = "Enter a valid price";
    if (!formData.seats || formData.seats <= 0)
      newErrors.seats = "Enter a valid seat count";
    if (!selectedCompany)
      newErrors.company = "Please select a valid company";
    return newErrors;
  };


  
  const getImageUrl = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post("http://localhost:8080/api/images/upload", formData);
  return response.data;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  const newErrors = validate();
  if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

  if(JSON.stringify(formData) === JSON.stringify(formData1))
  {
    return;
  }

  setLoading(true);
  setError("");

  try {
    let imageUrl = selected.imageUrl; // keep existing image by default

    if (imageFile) {
      imageUrl = await getImageUrl(imageFile); // only replace if a new file was picked
    }

    console.log(selectedCompanyName);
    console.log(selectedModelName);

    const payload = {
      companyName: selectedCompanyName,
      modelName: selectedModelName,
      pricePerHour: formData.pricePerHour,
      rentalStatus: formData.rentalStatus.toUpperCase(),
      seats: formData.seats,
      fuel: formData.fuel,
      imageUrl: imageUrl,
      tag: formData.tag,
    };

    const response = await axios.put(`http://localhost:8080/api/car/${selected.carId}`, payload);

    const updatedCar = response.data.car;


    setCars(cars.map((c) => (c.carId === updatedCar.carId ? updatedCar : c)));
    setSelected(updatedCar);
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
    setLoading(false);
  }
};

  const handleReset = () => {
    if (!selected) return;
    setFormData({
      pricePerHour: selected.pricePerHour,
      rentalStatus: selected.rentalStatus.toLowerCase(),
      seats: selected.seats || "",
      fuel:  selected.fuel  || "PETROL",
      tag:   selected.tag   || "",
    });
    setSelectedCompany(selected.company);
    setCompanySearch(selected.company.companyName);
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
    setSaved(false);
  };


 console.log("cannotChange: " , cannotChange);

  return (
    <div className="page">
      <div className="update-wrapper">

        {/* ── Left: Car Picker ── */}
        <div className="car-list-card">
          <h3>Select Car</h3>
          <input
            className="search-input"
            type="text"
            placeholder="Search car model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filteredCars.length > 0) handleSelectCar(filteredCars[0]);
            }}
          />
          <div className="car-list">
            {filteredCars.length === 0 && <p className="no-result">No cars found</p>}
            {filteredCars.map((car) => (
              <div
                key={car.carId}
                className={`car-item ${selected?.carId === car.carId ? "active" : ""}`}
                onClick={() => handleSelectCar(car)}
              >
                <div className="car-avatar">🚗</div>
                <div className="car-item-info">
                  <p className="car-item-name">{car.modelName}</p>
                  <p className="car-item-company">{car.company.companyName}</p>
                </div>
                <span
                  className="car-status-badge"
                  style={{
                    color: statusColors[car.rentalStatus.toLowerCase()].color,
                    backgroundColor: statusColors[car.rentalStatus.toLowerCase()].bg,
                    border: `1px solid ${statusColors[car.rentalStatus.toLowerCase()].border}40`,
                  }}
                >
                  <span className="status-dot" style={{ backgroundColor: statusColors[car.rentalStatus.toLowerCase()].dot }}></span>
                  {car.rentalStatus.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Edit Form ── */}
        <div className="form-card">
          {!selected ? (
            <div className="empty-state">
              <div className="empty-icon">🚗</div>
              <h3>No Car Selected</h3>
              <p>Pick a car from the left to update its info</p>
            </div>
          ) : (
            <>
              <div className="form-header">
                <div className="form-icon">🚗</div>
                <div>
                  <h2>Update Car Info</h2>
                  <p>Editing: <span className="highlight">{selected.modelName}</span></p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="form">

                {/* Row 1 — Price + Seats */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Price Per Hour ($)</label>
                    <input
                      type="number"
                      name="pricePerHour"
                      min="0"
                      value={formData.pricePerHour}
                      onChange={(e) => {
                        setFormData({ ...formData, pricePerHour: e.target.value });
                        setErrors({ ...errors, pricePerHour: "" });
                      }}
                    />
                    {errors.pricePerHour && <span className="error">{errors.pricePerHour}</span>}
                  </div>

                  <div className="form-group">
                    <label>Seats</label>
                    <input
                      type="number"
                      name="seats"
                      min="1"
                      max="20"
                      value={formData.seats}
                      onChange={(e) => {
                        setFormData({ ...formData, seats: e.target.value });
                        setErrors({ ...errors, seats: "" });
                      }}
                    />
                    {errors.seats && <span className="error">{errors.seats}</span>}
                  </div>
                </div>

                {/* Rental Status */}
                <div className="form-group">
                  <label>Rental Status</label>
                  <div className="status-options">
                    {rentalStatus.map((status) => (
                      <button
                        type="button"
                        key={status}
                        className="status-btn"
                        style={
                          formData.rentalStatus === status
                            ? {
                                borderColor: statusColors[status].border,
                                color: statusColors[status].color,
                                backgroundColor: statusColors[status].bg,
                              }
                            : {}
                        }
                        onClick={() => setFormData({ ...formData, rentalStatus: status })}
                      >
                        <span className="status-dot" style={{ backgroundColor: statusColors[status].dot }}></span>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

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

                {/* Tag */}
                <div className="form-group">
                  <label>Tag <span className="optional">(optional)</span></label>
                  <div className="tag-options">
                    {tagOptions.map((t) => (
                      <button
                        type="button"
                        key={t}
                        className={`tag-btn ${formData.tag === t ? "tag-active" : ""}`}
                        onClick={() => setFormData({ ...formData, tag: formData.tag === t ? "" : t })}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company */}
                <div className="form-group" style={{ position: "relative" }}>
                  <label>Company</label>
                  <input
                    type="text"
                    placeholder="Search company..."
                    value={companySearch}
                    className={selectedCompany ? "input-verified" : ""}
                    onChange={(e) => {
                      setCompanySearch(e.target.value);
                      setSelectedCompany(null);
                      setShowDropdown(true);
                      setErrors({ ...errors, company: "" });
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
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
                              <p className="dropdown-city">{company.companyCity}, {company.companyCountry}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {selectedCompany && (
                  <div className="company-preview">
                    <div className="preview-avatar">{selectedCompany.companyName.charAt(0)}</div>
                    <div>
                      <p className="preview-name">{selectedCompany.companyName}</p>
                      <p className="preview-city">{selectedCompany.companyAddress}  , {selectedCompany.companyCity}</p>
                    </div>
                    <button
                      type="button"
                      className="preview-remove"
                      onClick={() => { setSelectedCompany(null); setCompanySearch(""); }}
                    >✕</button>
                  </div>
                )}

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
                        <p>Click to upload new image</p>
                      </div>
                    </label>
                  ) : (
                    <div className="image-preview-wrapper">
                      <img src={imagePreview} alt="Car preview" className="image-preview" />
                      <button type="button" className="image-remove-btn" onClick={handleImageRemove}>
                        ✕  Click to change car image
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={handleReset}>Reset</button>
                  <button type="submit" className="btn-submit" disabled={loading || cannotChange}
                   style={cannotChange ? { backgroundColor: "#444", color: "#999", cursor: "not-allowed" } : {}}>
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                {saved  && <div className="success-msg">✅ Car updated successfully!</div>}
                {error  && <div className="error-msg">❌ {error}</div>}

              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UpdateCar;