import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../CSS/Payment.css";
//import { ensureMockUser } from "../mockUser";
//import { saveBooking } from "../bookingStore";
import { getUserIdFomToken } from "../../../utils/tokenUtils";
import axios from "axios";

const PAY_METHODS = [
  { key: "bkash", label: "bKash", color: "#e2136e", initial: "b" },
  { key: "nagad", label: "Nagad", color: "#f26522", initial: "N" },
];

const STEP = { DETAILS: 1, PAYMENT: 2, RECEIPT: 3 };

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const carData  = location.state?.car;

  if (!carData) {
    navigate("/user-home");
    return null;
  }

  const car = {
    carId:          carData.carId,
    model:          carData.modelName,
    company:        carData.company?.companyName,
    address:        carData.company?.companyAddress || "N/A",
    city:           carData.company?.companyCity    || "",
    price_per_hour: carData.pricePerHour,
    image:          carData.imageUrl || null
  };

  const  userId = getUserIdFomToken();

  const [step,       setStep]       = useState(STEP.DETAILS);
  const [days,       setDays]       = useState(0);
  const [hours,      setHours]      = useState(1);
  const [address,    setAddress]    = useState("");
  const [phone,      setPhone]      = useState("");
  const [method,     setMethod]     = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors,     setErrors]     = useState({});
  const [bookingInfo , setBookingInfo] = useState(null);

  const [bookingId , setBookingId]   = useState(0);
  const [bookingTime] = useState(new Date());

  const userCity      = car.city;
  const totalHours    = days * 24 + hours;
  const totalPrice    = parseFloat((totalHours * car.price_per_hour).toFixed(2));
  const durationLabel = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

  function formatDateTime(iso) {
  const date = new Date(iso);

  const datePart = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timePart = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return `${datePart}, ${timePart}`;
}


function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}


function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}


  const validateDetails = () => {
    const e = {};
    if (!address.trim())          e.address  = "Required.";
    if (!userCity)                 e.userCity = "Service city unavailable for this car.";
    if (!/^01\d{9}$/.test(phone)) e.phone    = "Enter a valid 11-digit BD number (starts with 01).";
    if (totalHours < 1)           e.duration = "Minimum rental is 1 hour.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePayment = () => {
    const e = {};
    if (!method) e.method = "Please select a payment method.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextDetails = () => {
    if (validateDetails()) { 
           setErrors({}); 
          setStep(STEP.PAYMENT); 
          console.log("heerere");
        }
  };

 const getPaymentId = async () => {
  const payload = {
    carId: car.carId,
    userId: userId,
    paymentMethod: method.toUpperCase(),
    paymentStatus: "DONE",
    paymentType: "RENTED_PRICE",
    totalAmount: totalPrice,
  }

  try {
    const response = await axios.post("http://localhost:8080/api/payment", payload);

    // console.log(response.data.payment.paymentId);
    
    return response.data.payment.paymentId;

  } catch (err) {
    const message = err.response?.data?.message || err.message
    console.log("something went wrong in getPaymentId", message)
    setErrors((prev) => ({ ...prev, getPaymentId: message }))
    throw err
  }
}

 const handleConfirmPay = async () => {
  if (!validatePayment()) return;
  setErrors({});
  setProcessing(true);

  try {
    const paymentId = await getPaymentId();

    const payload = {
      userId: userId,
      paymentId: paymentId,
      carId: car.carId,
      totalprice: totalPrice,
      days: days,
      hour: hours,
      totalHours: totalHours,
      address: address,
      phone: phone,
    };

    const response = await axios.post("http://localhost:8080/api/booking", payload);

    const carNeedUpdate = response.data.bookings.car;

    setBookingInfo(response.data.bookings);


    const statusUpdatePayload = {
      carId: car.carId,
      rentalStatus: "RENTED"
    };

    const response_of_car_update = await axios.patch("http://localhost:8080/api/car/updateCarRentalStatus",statusUpdatePayload);

     setStep(STEP.RECEIPT);

  } catch (err) {
    const message = err.response?.data?.message || err.message;
    console.log("something went wrong in handleConfirmPay:", message);
    setErrors((prev) => ({ ...prev, confirmPay: message }));
  } finally {
    setProcessing(false);
  }
};

  const handleDownload = () => {
    const content = `
DriveX — Booking Receipt
========================
Booking ID    : ${bookingInfo?.bookingId}
Booked At     : ${formatDateTime(bookingInfo?.bookingTime)}
------------------------
CAR DETAILS
Model         : ${car.model}
Company       : ${car.company}
Office        : ${car.address}, ${car.city}
------------------------
BOOKING INFO
Pickup Address: ${address}
Contact Phone : ${phone}
Duration      : ${durationLabel} (${totalHours} hours)
Rate          : $${car.price_per_hour}/hr
------------------------
PAYMENT
Method        : ${PAY_METHODS.find(m => m.key === method)?.label}
Status        : PAID ✅
------------------------
TOTAL PAID    : $${totalPrice}
========================
Thank you for choosing DriveX!
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `DriveX_${bookingId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pay-root">
      <div className="pay-card">

        <div className="pay-header">
          <div className="pay-logo"><span className="ld">Drive</span><span className="lx">X</span></div>
          <h1 className="pay-title">Book Your Car</h1>
          <p className="pay-subtitle">Reserve now, drive instantly</p>
        </div>

        <PayStepBar current={step} />

  {/* ══ STEP 1 — BOOKING DETAILS ══ */}
        {step === STEP.DETAILS && (
          <div className="pay-section">

            <div className="car-info-card">
              <div className="car-info-img-wrap">
                {car.image ? (
                  <img src={car.image} alt={car.model} className="car-info-img"
                    onError={(e) => { e.target.style.display = "none"; }} />
                ) : (
                  <div className="no-image-placeholder">📷 No Image</div>
                )}
              </div>
              <div className="car-info-body">
                <div className="car-info-model">{car.model}</div>
                <div className="car-info-company">{car.company}</div>
                <div className="car-info-location"><span>📍</span><span>{car.address}, {car.city}</span></div>
                <div className="car-info-rate">${car.price_per_hour}<span>/hr</span></div>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">⏱ Rental Duration</label>
              <div className="duration-row">
                <div className="duration-unit-wrap">
                  <div className="duration-label-sm">Days</div>
                  <div className="dur-picker">
                    <button className="dur-btn" onClick={() => setDays(d => Math.max(0, d - 1))}>−</button>
                    <span className="dur-num">{days}</span>
                    <button className="dur-btn" onClick={() => setDays(d => Math.min(30, d + 1))}>+</button>
                  </div>
                </div>
                <div className="dur-sep">:</div>
                <div className="duration-unit-wrap">
                  <div className="duration-label-sm">Hours</div>
                  <div className="dur-picker">
                    <button className="dur-btn" onClick={() => setHours(h => Math.max(0, h - 1))}>−</button>
                    <span className="dur-num">{hours}</span>
                    <button className="dur-btn" onClick={() => setHours(h => Math.min(23, h + 1))}>+</button>
                  </div>
                </div>
                <div className="dur-total-label">= <span className="dur-total-val">{totalHours}h total</span></div>
              </div>
              {errors.duration && <div className="field-error">{errors.duration}</div>}
            </div>

            <div className="field-group">
              <label className="field-label">🏠 Pickup Address</label>
              <div className="address-grid">
                <div className="addr-field">
                  <div className="addr-prefix">Address</div>
                  <input
                    className={`pay-input addr-input ${errors.address ? "err" : ""}`}
                    placeholder="Mohakhali DOHS Road 11 house 49"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  {errors.address && <div className="field-error">{errors.address}</div>}
                </div>
              </div>
              {address && (
                <div className="address-preview">
                  📍 {address}{userCity ? `, ${userCity}` : ""}
                </div>
              )}
            </div>

            <div className="field-group">
              <label className="field-label">📱 Contact Phone</label>
              <div className="phone-wrap">
                <div className="phone-prefix">+880</div>
                <input
                  className={`pay-input phone-input ${errors.phone ? "err" : ""}`}
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              {errors.phone && <div className="field-error">{errors.phone}</div>}
            </div>

            <PriceSummary
              days={days} hours={hours} totalHours={totalHours}
              rate={car.price_per_hour} total={totalPrice}
            />

            <button className="pay-btn primary" onClick={handleNextDetails}>
              Proceed to Payment →
            </button>
          </div>
        )}

        {/* ══ STEP 2 — PAYMENT ══ */}
        {step === STEP.PAYMENT && (
          <div className="pay-section">

            <div className="recap-box">
              <div className="recap-row"><span>Car</span><span className="recap-val">{car.model}</span></div>
              <div className="recap-row"><span>Pickup</span><span className="recap-val sm">{address}</span></div>
              <div className="recap-row"><span>Phone</span><span className="recap-val">{phone}</span></div>
              <div className="recap-row"><span>Duration</span><span className="recap-val">{durationLabel} ({totalHours}h)</span></div>
              <div className="recap-divider" />
              <div className="recap-row total-row">
                <span>Total</span>
                <span className="recap-total">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">💳 Payment Method</label>
              <div className="method-note">🔧 Testing mode — select method and confirm to simulate payment</div>
              <div className="method-grid">
                {PAY_METHODS.map((m) => (
                  <button key={m.key}
                    className={`method-card ${method === m.key ? "active" : ""}`}
                    onClick={() => setMethod(m.key)}
                  >
                    <div className="method-logo" style={{ background: m.color }}>{m.initial}</div>
                    <div className="method-name">{m.label}</div>
                    <div className="method-tag">{method === m.key ? "✓ Selected" : "Select"}</div>
                  </button>
                ))}
              </div>
              {errors.method && <div className="field-error">{errors.method}</div>}
            </div>

            <PriceSummary
              days={days} hours={hours} totalHours={totalHours}
              rate={car.price_per_hour}  total={totalPrice}
            />

            <button
              className={`pay-btn primary ${processing ? "loading" : ""}`}
              onClick={handleConfirmPay}
              disabled={processing}
            >
              {processing
                ? <span className="pay-spinner">⏳ Processing {PAY_METHODS.find(m => m.key === method)?.label}...</span>
                : `Confirm & Pay $${totalPrice.toFixed(2)} ✓`
              }
            </button>
            <button className="pay-btn ghost"
              onClick={() => { setErrors({}); setStep(STEP.DETAILS); }}
              disabled={processing}
            >
              ← Edit Details
            </button>
          </div>
        )}

        {/* ══ STEP 3 — RECEIPT ══ */}
        {step === STEP.RECEIPT && (
          <div className="pay-section">

            <div className="success-banner">
              <div className="success-icon">🎉</div>
              <div>
                <div className="success-title">Booking Confirmed!</div>
                <div className="success-sub">Your car is reserved. Show this at the office.</div>
              </div>
            </div>

            <div className="receipt">
              <div className="receipt-header">
                <div className="receipt-logo"><span>Drive</span><span className="rx">X</span></div>
                <div className="receipt-tag">BOOKING RECEIPT</div>
              </div>
              <div className="receipt-divider dashed" />

              <div className="receipt-rows">
                <div className="receipt-row"><span>Booking ID</span><span className="rv mono">{bookingInfo?.bookingId}</span></div>
                <div className="receipt-row"><span>Booked At</span><span className="rv">{formatDateTime(bookingInfo?.bookingTime)}</span></div>
              </div>
              <div className="receipt-divider dashed" />

              <div className="receipt-rows">
                <div className="receipt-section-title">🚗 Car Details</div>
                <div className="receipt-row"><span>Model</span><span className="rv">{car.model}</span></div>
                <div className="receipt-row"><span>Company</span><span className="rv">{car.company}</span></div>
                <div className="receipt-row"><span>Office</span><span className="rv sm">{car.address}, {car.city}</span></div>
              </div>
              <div className="receipt-divider dashed" />

              <div className="receipt-rows">
                <div className="receipt-section-title">📍 Booking Info</div>
                <div className="receipt-row"><span>Pickup</span><span className="rv sm">{address}</span></div>
                <div className="receipt-row"><span>Phone</span><span className="rv">{phone}</span></div>
                <div className="receipt-row"><span>Duration</span><span className="rv">{durationLabel} ({totalHours}h)</span></div>
                <div className="receipt-row"><span>Rate</span><span className="rv">${car.price_per_hour}/hr</span></div>
              </div>
              <div className="receipt-divider dashed" />

              <div className="receipt-rows">
                <div className="receipt-section-title">💳 Payment</div>
                <div className="receipt-row">
                  <span>Method</span>
                  <span className="rv">{PAY_METHODS.find(m => m.key === method)?.label}</span>
                </div>
                <div className="receipt-row"><span>Status</span><span className="rv green">Paid ✅</span></div>
                <div className="receipt-row"><span>Base Price</span><span className="rv">${totalPrice.toFixed(2)}</span></div>
              </div>
              <div className="receipt-divider" />

              <div className="receipt-total-row">
                <span>Total Paid</span>
                <span className="receipt-total-val">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="receipt-divider" />

              <div className="receipt-footer">
                <div className="rf-ref">Ref: {bookingInfo?.bookingId}</div>
                <div className="rf-date">{formatDateTime(bookingInfo?.bookingTime)}</div>
              </div>
            </div>

            <button className="pay-btn download" onClick={handleDownload}>⬇ Download Receipt</button>
            <button className="pay-btn primary" onClick={() => navigate("/user-home")}>
              Browse More Cars
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

// ── Price Summary ──
function PriceSummary({ days, hours, totalHours, rate, total }) {
  return (
    <div className="price-summary">
      {days > 0  && <div className="ps-row"><span>Days</span><span>{days}d × 24h × ${rate}/hr</span></div>}
      {hours > 0 && <div className="ps-row"><span>Hours</span><span>{hours}h × ${rate}/hr</span></div>}
      <div className="ps-row"><span>Total Hours</span><span>{totalHours}h</span></div>
      <div className="ps-divider" />
      <div className="ps-row total"><span>Total</span><span className="ps-total">${total.toFixed(2)}</span></div>
    </div>
  );
}

// ── Step Bar ──
function PayStepBar({ current }) {
  const steps = ["Booking Details", "Payment", "Receipt"];
  return (
    <div className="pay-stepbar">
      {steps.map((label, i) => {
        const num = i + 1; const done = current > num; const active = current === num;
        return (
          <div key={num} className="pay-step-item">
            <div className={`pay-step-circle ${done ? "done" : active ? "active" : ""}`}>{done ? "✓" : num}</div>
            <div className={`pay-step-label ${active ? "active" : done ? "done" : ""}`}>{label}</div>
            {i < steps.length - 1 && <div className={`pay-step-line ${done ? "done" : ""}`} />}
          </div>
        );
      })}
    </div>
  );
}