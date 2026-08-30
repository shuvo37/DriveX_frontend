import { useEffect, useState } from "react";
import axios from "axios";
import styles from "../admin/CSS/SearchBookingCar.module.css";

const statusColors = {
  ONGOING:   { color: "#52b788", bg: "#1a3a2a", border: "#2d6a4f", dot: "#52b788" },
  SUBMITTED: { color: "#f0a500", bg: "#3a2f0a", border: "#6a5a2d", dot: "#f0a500" },
  COMPLETED: { color: "#6366f1", bg: "#1e1e3a", border: "#3a3a6a", dot: "#6366f1" },
};

function SearchBookingCar() {
  const [carModel, setCarModel] = useState("");
  const [bookings, setBookings] = useState(null);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [fullName , setFullName] = useState("");

  const handleSearch = async () => {
    if (!carModel.trim()) return;
    setSearching(true);
    setError("");
    setSearched(true);

    try {
      const res = await axios.get("http://localhost:8080/api/booking/search-Booking-Car", {
        params: { modelName: carModel },
      });
      setBookings(res.data); // null if not currently booked
    } catch (err) {
      setBookings(null);
      setError(
        err.response
          ? (typeof err.response.data === "string" ? err.response.data : "Failed to fetch bookings")
          : "Server is not running. Please try again."
      );
    } finally {
      setSearching(false);
    }
  };

  useEffect(()=>{

       if(bookings?.user)
       {

        setFullName(`${bookings.user.firstName} ${bookings.user.lastName}`);
        
       }


  } , [bookings]);

  const badge = (status) => statusColors[status] || statusColors.SUBMITTED;

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.searchCard}>
          <h3>Search Car Bookings</h3>
          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Enter car model..."
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className={styles.btnSubmit} onClick={handleSearch} disabled={searching}>
              {searching ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {error && <div className={styles.errorMsg}>❌ {error}</div>}

        {searched && !error && !bookings && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🚗</div>
            <h3>No Bookings Found</h3>
            <p>No ongoing bookings for "{carModel}"</p>
          </div>
        )}

        {bookings && (
          <div className={styles.bookingList}>
            <div className={styles.bookingCard}>
              <div className={styles.bookingHeader}>
                <span className={styles.bookingId}>Booking #{bookings.bookingId}</span>
                <span
                  className={styles.statusBadge}
                  style={{
                    color: badge(bookings.bookingStatus).color,
                    backgroundColor: badge(bookings.bookingStatus).bg,
                    border: `1px solid ${badge(bookings.bookingStatus).border}`,
                  }}
                >
                  <span
                    className={styles.statusDot}
                    style={{ backgroundColor: badge(bookings.bookingStatus).dot }}
                  ></span>
                  {bookings.bookingStatus}
                </span>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Address</span>
                  <span className={styles.infoValue}>{bookings.address}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Phone</span>
                  <span className={styles.infoValue}>{bookings.phone}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Days / Hours</span>
                  <span className={styles.infoValue}>{bookings.days}d {bookings.hour}h (total {bookings.totalHours}h)</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Total Price</span>
                  <span className={styles.infoValue}>${bookings.totalprice}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Rent Start</span>
                  <span className={styles.infoValue}>{bookings.rentStart ?? "—"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>User ID</span>
                  <span className={styles.infoValue}>{bookings.user?.userId ?? "—"}</span>
                </div>
              <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>User Name</span>
                  <span className={styles.infoValue}>{fullName}</span>
                </div>
                 <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>User Emial</span>
                  <span className={styles.infoValue}>{bookings.user?.email ?? "—"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Payment ID</span>
                  <span className={styles.infoValue}>{bookings.payment?.paymentId ?? "—"}</span>
                </div>


              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchBookingCar;