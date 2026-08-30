import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/CarShowcase.css";
import axios from "axios";
import { getEmailFromToken , getRoleFromToken , getUserIdFomToken } from "../../../utils/tokenUtils";

const TAG_COLORS = {
  SUV:         "#8b5cf6",
  Luxury:      "#f59e0b",
  Family:      "#10b981",
  Sports:      "#ef4444",
  Economy:     "#6b7280",
  Convertible: "#06b6d4",
  Van:         "#3b82f6",
  Truck:       "#f97316",
};

const FUEL_TYPES = ["PETROL", "DIESEL", "HYBRID", "ELECTRICITY"];
const fuelEmoji  = { PETROL: "⛽", DIESEL: "🛢️", HYBRID: "🔋", ELECTRICITY: "⚡" };

export default function CarShowcase() {
  const [cars,              setCars]              = useState([]);
  const [companies,         setCompanies]         = useState([]);
  const [loadingCars,       setLoadingCars]       = useState(true);
  const [fetchError,        setFetchError]        = useState("");

  const [priceRange,        setPriceRange]        = useState([0, 100]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedFuels,     setSelectedFuels]     = useState([]);
  const [sortBy,            setSortBy]            = useState("price_asc");
  const [sidebarOpen,       setSidebarOpen]       = useState(true);
  const [selectedCity,      setSelectedCity]      = useState([]);


  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:8080/api/car"),
      axios.get("http://localhost:8080/api/company"),
    ])
      .then(([carsRes, companiesRes]) => {
        const carsData = carsRes.data;
        const companiesData = companiesRes.data;

        setCars(carsData);
        setCompanies(companiesData);

        const prices = carsData.map((c) => c.pricePerHour);
        if (prices.length > 0) {
          setPriceRange([Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]);
        }
      })
      .catch(() => setFetchError("Failed to load cars. Is the backend running?"))
      .finally(() => setLoadingCars(false));
  }, []);

  /*useEffect(() => {
  setCars(MOCK_CARS);
  setCompanies(MOCK_COMPANIES);

  const prices = MOCK_CARS.map((c) => c.pricePerHour);
  if (prices.length > 0) {
    setPriceRange([Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]);
  }

  setLoadingCars(false);
}, []);*/


  const allCity = cars.map((car) => car.company.companyCity);
  const distinctCity = [...new Set(allCity)];
  const allBrand = cars.map((car)=>car.company.companyName);
  const distinctBrand = [...new Set(allBrand)];
  const minPrice = cars.length > 0 ? Math.floor(Math.min(...cars.map((c) => c.pricePerHour))) : 0;
  const maxPrice = cars.length > 0 ? Math.ceil(Math.max(...cars.map((c) => c.pricePerHour))) : 100;

  const toggleCompany = (c) =>
    setSelectedCompanies((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const toggleCity = (c) =>
    setSelectedCity((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const toggleFuel = (f) =>
    setSelectedFuels((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  const filtered = useMemo(() => {
    let list = cars.filter(
      (c) =>
        c.rentalStatus === "AVAILABLE" &&
        c.pricePerHour >= priceRange[0] &&
        c.pricePerHour <= priceRange[1] &&
        (selectedCompanies.length === 0 || selectedCompanies.includes(c.company?.companyName)) &&
        (selectedFuels.length === 0     || selectedFuels.includes(c.fuel)) &&
        (selectedCity.length === 0      || selectedCity.includes(c.company.companyCity))
    );
    if (sortBy === "price_asc")  list.sort((a, b) => a.pricePerHour - b.pricePerHour);
    if (sortBy === "price_desc") list.sort((a, b) => b.pricePerHour - a.pricePerHour);
    if (sortBy === "name")       list.sort((a, b) => a.modelName.localeCompare(b.modelName));
    return list;
  }, [cars, priceRange, selectedCompanies, selectedFuels, sortBy, selectedCity]);

  const clearFilters = () => {
    setPriceRange([minPrice, maxPrice]);
    setSelectedCompanies([]);
    setSelectedFuels([]);
    setSelectedCity([]); // 👈 was `selectedCity([])` — that's calling the value, not the setter
  };

  const hasActiveFilters =
    selectedCompanies.length > 0 ||
    selectedFuels.length > 0     ||
    selectedCity.length > 0      ||
    priceRange[0] !== minPrice   ||
    priceRange[1] !== maxPrice;

  return (
    <div className="csw-page-root">
      <div className="csw-layout">

        {/* ── Sidebar ── */}
        <aside className="csw-sidebar" style={{ width: sidebarOpen ? 260 : 0 }}>
          <div className="csw-sidebar-inner">

            <div className="csw-filter-header">
              <span className="csw-filter-title">Filters</span>
              {hasActiveFilters && (
                <button className="csw-clear-btn" onClick={clearFilters}>Clear all</button>
              )}
            </div>

            <div className="csw-filter-section">
              <div className="csw-filter-label">💰 Price per hour</div>
              <div className="csw-price-display">
                <span className="csw-price-tag">${priceRange[0]}</span>
                <span className="csw-price-sep">to</span>
                <span className="csw-price-tag">${priceRange[1]}</span>
              </div>
              <div className="csw-range-wrap">
                <span className="csw-range-hint">${minPrice}</span>
                <input
                  type="range"
                  className="csw-range-input"
                  min={minPrice}
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                />
                <span className="csw-range-hint">${maxPrice}</span>
              </div>
            </div>

            <div className="csw-filter-section">
              <div className="csw-filter-label">🏭 Brand</div>
              <div className="csw-chip-grid">
                {distinctBrand.map((c) => (
                  <button
                    key={c}
                    className={`csw-chip ${selectedCompanies.includes(c) ? "csw-chip-active" : ""}`}
                    onClick={() => toggleCompany(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="csw-filter-section">
              <div className="csw-filter-label">🏙️ City</div>
              <div className="csw-chip-grid">
                {distinctCity.map((c) => (
                  <button
                    key={c}
                    className={`csw-chip ${selectedCity.includes(c) ? "csw-chip-active" : ""}`}
                    onClick={() => toggleCity(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="csw-filter-section">
              <div className="csw-filter-label">⛽ Fuel Type</div>
              <div className="csw-chip-grid">
                {FUEL_TYPES.map((f) => (
                  <button
                    key={f}
                    className={`csw-chip ${selectedFuels.includes(f) ? "csw-chip-active" : ""}`}
                    onClick={() => toggleFuel(f)}
                  >
                    {fuelEmoji[f]} {f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* ── Main ── */}
        <main className="csw-main">

          <div className="csw-toolbar">
            <button className="csw-toggle-btn" onClick={() => setSidebarOpen((p) => !p)}>
              {sidebarOpen ? "◀ Hide Filters" : "▶ Show Filters"}
            </button>
            <span className="csw-result-count">
              <strong>{filtered.length}</strong> cars found
            </span>
            <div className="csw-sort-wrap">
              <span className="csw-sort-label">Sort:</span>
              <select
                className="csw-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>

          {fetchError && <div className="csw-fetch-error">❌ {fetchError}</div>}

          {loadingCars ? (
            <div className="csw-empty-state">
              <div style={{ fontSize: 48 }}>⏳</div>
              <div style={{ marginTop: 12 }}>Loading cars...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="csw-empty-state">
              <div style={{ fontSize: 48 }}>🚫</div>
              <div style={{ marginTop: 12 }}>No cars match your filters</div>
              <button className="csw-clear-btn-2" onClick={clearFilters}>Reset Filters</button>
            </div>
          ) : (
            <div className="csw-car-grid">
              {filtered.map((car) => (
                <CarCard key={car.carId} car={car} />
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ── Car Card ──
function CarCard({ car }) {
  const navigate = useNavigate();

  const imageSrc = car.imageUrl ? car.imageUrl : null;

  return (
    <div className="cscard-card">
      {car.tag && (
        <span className="cscard-tag" style={{ background: TAG_COLORS[car.tag] || "#6b7280" }}>
          {car.tag}
        </span>
      )}

      <div className="cscard-image-wrap">
        {imageSrc ? (
          <img src={imageSrc} alt={car.modelName} className="cscard-image" />
        ) : (
          <div className="cscard-no-image-placeholder">📷 No Image</div>
        )}
      </div>

      <div className="cscard-body">
        <div className="cscard-name">{car.modelName}</div>
        <div className="cscard-company">{car.company?.companyName}</div>
        <div className="cscard-meta">
          <span className="cscard-meta-pill">👥 {car.seats ?? "—"} seats</span>
          <span className="cscard-meta-pill">
            {fuelEmoji[car.fuel]} {car.fuel?.charAt(0) + car.fuel?.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      <div className="cscard-footer">
        <div>
          <span className="cscard-price">${car.pricePerHour}</span>
          <span className="cscard-per-hour">/hr</span>
        </div>
        <button
          className="cscard-book-btn"
          onClick={() => navigate("payment", { state: { car } })}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}