import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useCars from "../../../hooks/useCars";
import { pushRecentCarId, similarCars } from "../../../utils/carSearch";
import { TAG_COLORS, formatFuel, fuelEmoji } from "../../../utils/carDisplay";
import "../CSS/CarDetails.css";

const ESTIMATES = [
  { label: "1 hour", hours: 1 },
  { label: "6 hours", hours: 6 },
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
];

const STATUS = {
  AVAILABLE: { label: "Available", className: "is-available" },
  RENTED: { label: "Rented", className: "is-rented" },
  MAINTENANCE: { label: "In maintenance", className: "is-maintenance" },
};

export default function CarDetails() {
  const { carId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { cars, loading, error } = useCars();

  const clickedCar = location.state?.car;

  // The fresh list wins (the status may have changed). The car that was clicked fills in
  // until the list arrives, so the page opens instantly and still works after a refresh.
  const car = useMemo(() => {
    const fromList = cars.find((c) => String(c.carId) === carId);
    if (fromList) return fromList;
    return clickedCar && String(clickedCar.carId) === carId ? clickedCar : null;
  }, [cars, carId, clickedCar]);

  const currentCarId = car?.carId;

  useEffect(() => {
    window.scrollTo(0, 0); // opening a similar car starts at the top
  }, [carId]);

  useEffect(() => {
    if (currentCarId !== undefined) pushRecentCarId(currentCarId);
  }, [currentCarId]);

  const similar = useMemo(() => {
    if (!car) return [];
    return similarCars(car, cars.filter((c) => c.rentalStatus === "AVAILABLE"), 4);
  }, [car, cars]);

  if (!car) {
    return (
      <div className="cdt-page">
        <div className="cdt-state">
          {loading ? (
            <>
              <div className="cdt-state-icon">⏳</div>
              <div>Loading car...</div>
            </>
          ) : (
            <>
              <div className="cdt-state-icon">🚫</div>
              <div>{error || "This car could not be found."}</div>
              <button className="cdt-order-btn cdt-state-btn" onClick={() => navigate("/user-home")}>
                Back to cars
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const isAvailable = car.rentalStatus === "AVAILABLE";
  const status = STATUS[car.rentalStatus] ?? { label: car.rentalStatus, className: "" };
  const officeAddress = [car.company?.companyAddress, car.company?.companyCity].filter(Boolean).join(", ");

  // The Payment page opens on its "Booking Details" step when it receives the car this way.
  const orderNow = () => navigate("/user-home/payment", { state: { car } });

  const specs = [
    { label: "Brand", value: car.company?.companyName ?? "—" },
    { label: "Seats", value: `👥 ${car.seats ?? "—"} seats` },
    { label: "Fuel", value: `${fuelEmoji[car.fuel] ?? ""} ${formatFuel(car.fuel)}`.trim() },
    { label: "City", value: car.company?.companyCity ?? "—" },
    { label: "Type", value: car.tag ?? "—" },
    { label: "Pickup office", value: officeAddress || "—" },
  ];

  return (
    <div className="cdt-page">
      <div className="cdt-container">
        <button className="cdt-back" onClick={() => navigate("/user-home")}>
          ← Back to cars
        </button>

        <div className="cdt-grid">
          {/* ── Image ── */}
          <div className="cdt-image-panel">
            {car.tag && (
              <span className="cdt-tag" style={{ background: TAG_COLORS[car.tag] || "#6b7280" }}>
                {car.tag}
              </span>
            )}
            {car.imageUrl ? (
              <img
                src={car.imageUrl}
                alt={car.modelName}
                className="cdt-image"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="cdt-no-image">📷 No Image</div>
            )}
          </div>

          {/* ── Info + order ── */}
          <div className="cdt-info-panel">
            <h1 className="cdt-name">{car.modelName}</h1>
            <div className="cdt-company">{car.company?.companyName}</div>

            <div className="cdt-pills">
              <span className={`cdt-status ${status.className}`}>● {status.label}</span>
              <span className="cdt-pill">👥 {car.seats ?? "—"} seats</span>
              <span className="cdt-pill">
                {fuelEmoji[car.fuel]} {formatFuel(car.fuel)}
              </span>
            </div>

            {officeAddress && <div className="cdt-location">📍 {officeAddress}</div>}

            <div className="cdt-price-box">
              <div>
                <span className="cdt-price">${car.pricePerHour}</span>
                <span className="cdt-per-hour">/hr</span>
              </div>

              <div className="cdt-estimates">
                {ESTIMATES.map((e) => (
                  <div key={e.hours} className="cdt-estimate-row">
                    <span>{e.label}</span>
                    <span>${(e.hours * car.pricePerHour).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="cdt-estimate-note">You choose the duration on the next step.</div>
            </div>

            <button className="cdt-order-btn" onClick={orderNow} disabled={!isAvailable}>
              {isAvailable ? "Order Now →" : "Currently unavailable"}
            </button>
          </div>
        </div>

        {/* ── Specs ── */}
        <h2 className="cdt-section-title">Car information</h2>
        <div className="cdt-specs">
          {specs.map((s) => (
            <div key={s.label} className="cdt-spec">
              <div className="cdt-spec-label">{s.label}</div>
              <div className="cdt-spec-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Recommendations ── */}
        {similar.length > 0 && (
          <>
            <h2 className="cdt-section-title">You may also like</h2>
            <div className="cdt-similar-grid">
              {similar.map((c) => (
                <div
                  key={c.carId}
                  className="cdt-similar-card"
                  onClick={() => navigate(`/user-home/car/${c.carId}`, { state: { car: c } })}
                >
                  <div className="cdt-similar-img">
                    {c.imageUrl ? <img src={c.imageUrl} alt={c.modelName} /> : <span>📷</span>}
                  </div>
                  <div className="cdt-similar-body">
                    <div className="cdt-similar-name">{c.modelName}</div>
                    <div className="cdt-similar-company">{c.company?.companyName}</div>
                    <div className="cdt-similar-price">
                      ${c.pricePerHour}
                      <span>/hr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
