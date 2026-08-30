import { useState, useEffect } from "react";
import axios from "axios";
import "./CSS/carActiveStatus.css";

const statusColors = {
  available:   { border: "#52b788", color: "#52b788", bg: "#1a3a2a", dot: "#52b788" },
  rented:      { border: "#6366f1", color: "#a5b4fc", bg: "#1e1e3a", dot: "#6366f1" },
  maintenance: { border: "#f59e0b", color: "#fcd34d", bg: "#2a2010", dot: "#f59e0b" },
  not_active : { border: "#8b0616", color: "#ebeae7", bg: "#69070f", dot: "#f30505" } 
};

function CarActiveStatus() {
  const [cars, setCars] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:8080/api/car/all")
      .then((res) => setCars(res.data))
      .catch(() => setError("Failed to load cars"));
  }, []);


  const filtered = cars.filter((c) =>
    c.modelName.toLowerCase().includes(search.toLowerCase())
  );


  const handleSelect = (car) => {
    setSelected(car);
    setSaved(false);
    setError("");
  };

  const handleToggleActive = async () => {
  setUpdating(true);
  setError("");

  try {
    const payload = {
      modelName: selected.modelName,
      isActive: !selected.isActive,
    };

    const response = await axios.patch(
      "http://localhost:8080/api/car/update-Active-Status",
      payload
    );

    // Merge whatever the backend returned into the existing selected car,
    // instead of assuming the response has the full Car shape (company, carId, etc.)
    const updatedCar = { ...selected, ...response.data.car };

    setCars((prev) =>
      prev.map((c) => (c.carId === updatedCar.carId ? updatedCar : c))
    );
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
    setUpdating(false);
  }
};

  return (
    <div className="page">
      <div className="delete-wrapper">

        {/* ── Left: Car List (unchanged) ── */}
        <div className="car-list-card">
          <h3>Select Car</h3>
          <input
            className="search-input"
            type="text"
            placeholder="Search car model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered.length > 0) {
                handleSelect(filtered[0]);
              }
            }}
          />
          <div className="car-list">
            {filtered.length === 0 && (
              <p className="no-result">No cars found</p>
            )}
            {filtered.map((car) => (
            <div
                key={car.carId}
                className={`car-item ${selected?.carId === car.carId ? "active" : ""}`}
                onClick={() => handleSelect(car)}
              >
                <div className="car-avatar">🚗</div>
                <div className="car-item-info">
                  <p className="car-item-name">{car.modelName}</p>
                  <p className="car-item-company">{car.company.companyName}</p>
                </div>

                
                {!car.isActive?(

                  <span
                  className="car-status-badge"
                  style={{
                    color: statusColors["not_active"].color,
                    backgroundColor: statusColors["not_active"].bg,
                    border: `1px solid ${statusColors["not_active"].border}40`,
                  }}
                >
                  <span
                    className="status-dot"
                    style={{ backgroundColor: statusColors["not_active"].dot }}
                  ></span>
                  not_active
                </span>

                ):(
                  
                <span
                  className="car-status-badge"
                  style={{
                    color: statusColors[car.rentalStatus.toLowerCase()].color,
                    backgroundColor: statusColors[car.rentalStatus.toLowerCase()].bg,
                    border: `1px solid ${statusColors[car.rentalStatus.toLowerCase()].border}40`,
                  }}
                >
                  <span
                    className="status-dot"
                    style={{ backgroundColor: statusColors[car.rentalStatus.toLowerCase()].dot }}
                  ></span>
                  {car.rentalStatus.toLowerCase()}
                </span>
                )}

            

            </div>
            ))}
          </div>
        </div>

        {/* ── Right: Active Status Panel ── */}
        <div className="form-card">

          {error && <div className="error-msg">❌ {error}</div>}

          {!selected && (
            <div className="empty-state">
              <div className="empty-icon">🚗</div>
              <h3>No Car Selected</h3>
              <p>Pick a car from the left to view its status</p>
            </div>
          )}

          {selected && (
            <>
              <div className="form-header">
                <div className="form-icon">🚗</div>
                <div>
                  <h2>Car Status</h2>
                  <p>Viewing: <span className="highlight">{selected.modelName}</span></p>
                </div>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Model Name</span>
                  <span className="info-value">{selected.modelName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Company</span>
                  <span className="info-value">{selected.company.companyName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Price Per Hour</span>
                  <span className="info-value">${selected.pricePerHour}/hr</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Location</span>
                  <span className="info-value">{selected.company.companyCity}, {selected.company.companyCountry}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Rental Status</span>

                  {!selected.isActive?(

                  <span
                    className="info-status"
                    style={{
                      color: statusColors["not_active"].color,
                      backgroundColor: statusColors["not_active"].bg,
                      border: `1px solid ${statusColors["not_active"].border}40`,
                    }}
                  >
                    <span
                      className="status-dot"
                      style={{ backgroundColor: statusColors["not_active"].dot }}
                    ></span>
                    not_active
                  </span>
                  ):(

                    <span
                    className="info-status"
                    style={{
                      color: statusColors[selected.rentalStatus.toLowerCase()].color,
                      backgroundColor: statusColors[selected.rentalStatus.toLowerCase()].bg,
                      border: `1px solid ${statusColors[selected.rentalStatus.toLowerCase()].border}40`,
                    }}
                    >
                    <span
                      className="status-dot"
                      style={{ backgroundColor: statusColors[selected.rentalStatus.toLowerCase()].dot }}
                    ></span>
                    {selected.rentalStatus.toLowerCase()}
                  </span>

                  )}
               
                </div>
              </div>

              <div className="active-toggle-box">
                <div>
                  <p className="toggle-label">Active Status</p>
                  <p className="toggle-sublabel">
                    {selected.isActive ? "This car is visible to customers" : "This car is hidden from customers"}
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

export default CarActiveStatus;