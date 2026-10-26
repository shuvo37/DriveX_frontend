import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCars from "../../../hooks/useCars";
import { budgetPicks, getRecentCarIds, searchCars } from "../../../utils/carSearch";
import "./CarSearch.css";

const MAX_SUGGESTIONS = 6;

// Wraps the typed words in <mark> so the person sees why a car matched.
function Highlight({ text, query }) {
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (words.length === 0 || !text) return text;

  // With one capture group, split() puts the matches at the odd positions.
  const parts = text.split(new RegExp(`(${words.join("|")})`, "i"));
  return parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : part));
}

export default function CarSearch() {
  const navigate = useNavigate();
  const { cars, loading, error, refresh } = useCars();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recentIds, setRecentIds] = useState([]);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const trimmed = query.trim();

  // Same rule as the car grid: only cars that can be booked right now.
  const availableCars = useMemo(() => cars.filter((c) => c.rentalStatus === "AVAILABLE"), [cars]);

  const totalMatches = useMemo(
    () => (trimmed ? searchCars(availableCars, trimmed).length : 0),
    [availableCars, trimmed]
  );

  // The rows of the dropdown, in the order the arrow keys move through them.
  const options = useMemo(() => {
    if (trimmed) {
      const rows = searchCars(availableCars, trimmed)
        .slice(0, MAX_SUGGESTIONS)
        .map((car) => ({ kind: "car", car, group: "Suggestions" }));
      if (totalMatches > 0) rows.push({ kind: "all" });
      return rows;
    }

    const recent = recentIds
      .map((id) => availableCars.find((c) => c.carId === id))
      .filter(Boolean)
      .slice(0, 3);
    const picks = budgetPicks(availableCars, recent.map((c) => c.carId), 3);

    return [
      ...recent.map((car) => ({ kind: "car", car, group: "Recently viewed" })),
      ...picks.map((car) => ({ kind: "car", car, group: "Budget picks" })),
    ];
  }, [availableCars, trimmed, totalMatches, recentIds]);

  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const closeAndReset = () => {
    setOpen(false);
    setActive(-1);
    setQuery("");
    inputRef.current?.blur();
  };

  const openCar = (car) => {
    closeAndReset();
    navigate(`/user-home/car/${car.carId}`, { state: { car } });
  };

  const seeAllResults = () => {
    const text = trimmed;
    closeAndReset();
    navigate(`/user-home?q=${encodeURIComponent(text)}`);
  };

  const choose = (option) => {
    if (option.kind === "car") openCar(option.car);
    else seeAllResults();
  };

  const handleFocus = () => {
    setRecentIds(getRecentCarIds());
    setOpen(true);
    refresh(); // cheap: reuses the list if it is less than 30 seconds old
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    setActive(-1);
    setOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (options.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && options[active]) choose(options[active]);
      else if (trimmed) seeAllResults();
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = open && !(error && cars.length === 0 && !trimmed);

  return (
    <div className="car-search" ref={wrapRef}>
      <span className="car-search-icon" aria-hidden="true">🔍</span>

      <input
        ref={inputRef}
        className="car-search-input"
        type="text"
        placeholder="Search cars, brands, cities..."
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="car-search-list"
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `car-search-opt-${active}` : undefined}
        autoComplete="off"
      />

      {query && (
        <button
          type="button"
          className="car-search-clear"
          aria-label="Clear search"
          onMouseDown={(e) => e.preventDefault()} // keep focus in the input
          onClick={() => {
            setQuery("");
            setActive(-1);
            inputRef.current?.focus();
          }}
        >
          ✕
        </button>
      )}

      {showDropdown && (
        <div className="car-search-dropdown" id="car-search-list" role="listbox">
          {loading && cars.length === 0 ? (
            <div className="car-search-note">Loading cars...</div>
          ) : error && cars.length === 0 ? (
            <div className="car-search-note">{error}</div>
          ) : options.length === 0 ? (
            <div className="car-search-note">
              {trimmed ? (
                <>
                  No cars match <strong>“{trimmed}”</strong>.
                  <span className="car-search-hint">Try a brand, a model, a city or a fuel type.</span>
                </>
              ) : (
                "No cars available right now."
              )}
            </div>
          ) : (
            options.map((option, index) => {
              const previous = options[index - 1];
              const showHeading =
                option.kind === "car" && (!previous || previous.group !== option.group);
              const isActive = index === active;

              if (option.kind === "all") {
                return (
                  <div
                    key="all"
                    id={`car-search-opt-${index}`}
                    role="option"
                    aria-selected={isActive}
                    className={`car-search-all ${isActive ? "is-active" : ""}`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(option)}
                  >
                    See all {totalMatches} result{totalMatches === 1 ? "" : "s"} for “{trimmed}” →
                  </div>
                );
              }

              const { car } = option;
              return (
                <div key={`${option.group}-${car.carId}`}>
                  {showHeading && <div className="car-search-heading">{option.group}</div>}
                  <div
                    id={`car-search-opt-${index}`}
                    role="option"
                    aria-selected={isActive}
                    className={`car-search-option ${isActive ? "is-active" : ""}`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(option)}
                  >
                    <div className="car-search-thumb">
                      {car.imageUrl ? (
                        <img src={car.imageUrl} alt="" />
                      ) : (
                        <span>🚗</span>
                      )}
                    </div>
                    <div className="car-search-text">
                      <div className="car-search-name">
                        <Highlight text={car.modelName} query={trimmed} />
                      </div>
                      <div className="car-search-sub">
                        <Highlight text={car.company?.companyName ?? ""} query={trimmed} />
                        {car.company?.companyCity && (
                          <>
                            {" · "}
                            <Highlight text={car.company.companyCity} query={trimmed} />
                          </>
                        )}
                        {" · "}
                        {car.seats} seats
                      </div>
                    </div>
                    <div className="car-search-price">
                      ${car.pricePerHour}
                      <span>/hr</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
