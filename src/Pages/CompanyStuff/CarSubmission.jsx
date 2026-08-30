import { useState  , useEffect} from "react";
import styles from "./CarSubmission.module.css";
import axios from "axios";
import { getEmailFromToken } from "../../utils/tokenUtils";


const GRACE_HOURS = 1;

const STEP = { SEARCH: "SEARCH", CONFIRM: "CONFIRM", CASH: "CASH", RECEIPT: "RECEIPT" };

const REMIT_METHODS = [
  { key: "bkash", label: "bKash" },
  { key: "nagad", label: "Nagad" },
];




function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}


function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatLate(minutesLate) {
  if (minutesLate <= 0) return "On time";
  const h = Math.floor(minutesLate / 60);
  const m = minutesLate % 60;
  if (h === 0) return `${m} min late`;
  if (m === 0) return `${h} hr late`;
  return `${h} hr ${m} min late`;
}

let now = null;

 const extra_pay = Number(2);

function calculateFine(booking) {
  const mustReturnBy = new Date(booking.rentStart).getTime()
    + booking.totalHours * 60 * 60 * 1000;

   now = Date.now();

  const minutesLate = Math.max(0, Math.floor((now - mustReturnBy) / 60000));
  const hoursLate = minutesLate / 60;
  const fineAmount = minutesLate > 0
    ? parseFloat((hoursLate * (Number(booking.car.pricePerHour) + extra_pay)).toFixed(2))
    : 0;

  return { mustReturnBy, minutesLate, fineAmount, status: minutesLate > 0 ? "late" : "ontime" };
}

function sendClearanceEmail(booking, receipt) {
  console.log(`📧 [SIMULATED] Email sent to ${booking.userEmail}`);
  console.log(receipt);
  return new Promise((resolve) => setTimeout(resolve, 800));
}

export default function CarSubmission() {
  const [step, setStep] = useState(STEP.SEARCH);
  const [selectedCar, setSelectedCar] = useState(null);
  const [fineInfo, setFineInfo] = useState(null);
  const [remitMethod, setRemitMethod] = useState(null);
  const [remitError, setRemitError] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [bookingCars , setBookingCars] = useState([]);
  const [search , setSearch] = useState("");
  const [selectedCarBooking , setSelectedCarBooking] = useState(null);
  const [showDropDown , setShowDropDown] = useState(false);
  const [hasFine , setHasFine] = useState(false);
  const userEmail = getEmailFromToken();
  const [submittedAt , setSubmittedAt] = useState(new Date().toISOString());
  const [submitSucessfully , setSubmitSuccessfully] = useState(false);
  const [rentalStatusUpdateSucessfully , setRentalStatusUpdateSucessfully] = useState(false)
  const [bookingStatusUpdateSuccessfully , setBookingStatusUpdateSuccessfully] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finePaidSuccessfully , setFinePaidSuccessfully] = useState(false);


  function formatDateTime(iso) {
  const date = new Date(iso);

  const datePart = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timePart = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return `${datePart}, ${timePart}`;
}

  useEffect(()=>{

      axios.get("http://localhost:8080/api/booking/get-all-ongoing-cars")
     .then((carRes)=>{

       const bookingCar = carRes.data;
       
       setBookingCars(bookingCar);

     })
     .catch((err)=>
     console.log("err inside get-all-rented-cars" , err.response?.data));

  } , [])

  // console.log("useremail " , userEmail);

    const getSelectedCarBooking = async (car)=>{

      try{


        const payload = {

          "carId" : car.carId,
          "email" : userEmail
        }

      //  console.log("car id " , car.carId);

        const response = await axios.post("http://localhost:8080/api/booking/get-booking-of-car" , payload);

        console.log("here " , response.data);

        return response.data;
        

      }
      catch(err)
      {

           console.log(" here error inside  getSelectedCarBooking : ", err.response?.data);

      }
      


    } 


    const handleProceed = ()=>
    {
      setSubmittedAt(now?new Date(now).toISOString():submittedAt);

       setStep(STEP.CASH);

          setReceipt({
      bookingId: selectedCarBooking.bookingId,
      modelName: selectedCar.modelName,
      companyName: selectedCar.company.companyName,
      orderedAt: selectedCarBooking.bookingTime,
      rentStart :selectedCarBooking.rentStart,
      mustReturnBy: fineInfo.mustReturnBy,
      returnedAt: submittedAt,
      minutesLate: fineInfo.minutesLate,
      fineAmount: fineInfo.fineAmount,
      remitMethod: remitMethod,
      totalCharged: fineInfo.fineAmount,
      submittedAt : submittedAt
      });

    }

    console.log("has fine"  , hasFine);


   const  handleSelectedCar = async (car)=>
   {

        setSelectedCar(car);

        const bookingOfCar = await  getSelectedCarBooking(car);

        setSelectedCarBooking(bookingOfCar);

        setShowDropDown(false);

        setSearch(car.modelName);

    
   }

   console.log("selected booking " , selectedCarBooking);


 const filteredCars = bookingCars.filter((car)=> car.modelName.toLowerCase().includes(search.toLowerCase()));


const handleSubmit = () => {
  setStep(STEP.CONFIRM);

  const fine = calculateFine(selectedCarBooking);

  setFineInfo(fine);
  setHasFine(fine.fineAmount > 0);

};

 console.log("fine info"  , fineInfo);
 console.log("step" , step);


 const normalizeMethod = (method) => {
  if (method === "bkash") return "BKASH";
  if (method === "nagad") return "NAGAD";
  return method?.toUpperCase();
};

 

 const handlePayment = async() =>{

   setIsSubmitting(true);

    try {


       const payload = {

         "paymentId": selectedCarBooking.payment.paymentId ,

         "bookingId":selectedCarBooking.bookingId,

         "carId" : selectedCarBooking.car.carId,

         "userId":selectedCarBooking.user.userId,

         "submittedAt": submittedAt

       }

       console.log("payload car id " , payload.carId);
       console.log("payload  booking id" , payload.bookingId);

      const response = await axios.post("http://localhost:8080/api/submission" , payload);

        setSubmitSuccessfully(true);

        console.log("submit Done")

      
      
    } catch (err) {

        if(err.response)
        {

             console.log("error inside submitCar" , err.response.data);

        }
        else{

            console.log("network error inside submitCar")

        }
      
    }



if(receipt.fineAmount > 0){

   const nomalizeRemitMethod = normalizeMethod(remitMethod);

    try {


        const payload = {
      carId: selectedCarBooking.car.carId,
      userId: selectedCarBooking.user.userId,
      paymentMethod: nomalizeRemitMethod,
      paymentStatus: "DONE",
      paymentType: "FINE",
      totalAmount: receipt.fineAmount,
    }

      const response = await axios.post("http://localhost:8080/api/payment", payload);

      setFinePaidSuccessfully(true);

      console.log("...........fine paid successfully");
      
      
    } catch (err) {

        if(err.response)
        {

             console.log("error inside submitCar payment" , err.response.data);

        }
        else{

            console.log("network error inside submitCar payment")

        }
      
    }


}
else{

    setFinePaidSuccessfully(true);
}



      try {

      let bookingId = Number(selectedCarBooking.bookingId);

      const response = await axios.patch(`http://localhost:8080/api/booking/set-booking-car-submitted/${bookingId}`);

        setBookingStatusUpdateSuccessfully(true);

         console.log("booking status update Done")
      
    } catch (err) {

        if(err.response)
        {

             console.log("error inside set-booking-car-submitte" , err.response.data.message);

        }
        else{

             console.log("network error inside set-booking-car-submitte")
        }
      
    }


    try {

      let carId = Number(selectedCarBooking.car.carId);

      const response = await axios.patch(`http://localhost:8080/api/car/updateCarRentalStatus/${carId}`);

         setRentalStatusUpdateSucessfully(true);
         
          console.log("rental status update Done")
      
    } catch (err) {

        if(err.response)
        {

             console.log("error inside updateCarRentalStatus" , err.response.data.message);

        }
        else{
          
            console.log("network error inside updateCarRentalStatus")
        }
      
    }finally{
      setIsSubmitting(false);
    }

        setStep(STEP.RECEIPT);

 }
  

  const handleReset = () => {
    setStep(STEP.SEARCH);
    setSelectedCar(null);
    setFineInfo(null);
    setRemitMethod(null);
    setRemitError("");
    setReceipt(null);
    setSearch("")
  };


const handleDownloadReceipt = () => {
  const content = `
DriveX — Car Submission Receipt
========================
Booking ID    : ${receipt.bookingId}
Car Model     : ${receipt.modelName}
Company       : ${receipt.companyName}
------------------------
TIMING
Ordered At    : ${formatDateTime(receipt.orderedAt)}
rentStartTime :  ${formatDateTime(receipt.rentStart)}
Must Return By: ${formatDateTime(receipt.mustReturnBy)}
Returned At   : ${formatDateTime(receipt.returnedAt)}
Status        : ${formatLate(receipt.minutesLate)}
------------------------
FINE SETTLEMENT
Fine Amount   : ${receipt.fineAmount === 0 ? "None" : `$${receipt.fineAmount.toFixed(2)}`}
${receipt.remitMethod ? `Sent Via      : ${receipt.remitMethod === "bkash" ? "bKash" : "Nagad"}` : ""}
------------------------
TOTAL CHARGED : $${receipt.totalCharged.toFixed(2)}
========================
Thank you for choosing DriveX!
  `.trim();

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DriveX_Return_${receipt.bookingId}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};


  return (
    <div className={styles["cs-root"]}>
      <div className={styles["cs-card"]}>

        <div className={styles["cs-header"]}>
          <div className={styles["cs-logo"]}>
            <span className={styles["cs-logo-d"]}>Drive</span>
            <span className={styles["cs-logo-x"]}>X</span>
          </div>
          <h1 className={styles["cs-title"]}>Car Submission (Worker)</h1>
          <p className={styles["cs-subtitle"]}>Process a returned vehicle</p>
        </div>

        {/* ══════════ SEARCH ══════════ */}
        {step === STEP.SEARCH && (
          <div className={styles["cs-section"]}>
            <label className={styles["cs-label"]}>🔍 Search booking by car model</label>
            <div className={styles["cs-autocomplete-wrap"]}>
              <input
                className={styles["cs-input"]}
                placeholder="e.g. Toyota Corolla..."
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                onFocus={()=> setShowDropDown(true)}
                onKeyDown={(e)=>{

                  if(e.key == "Enter" && filteredCars.length > 0)
                  {
                        handleSelectedCar(filteredCars[0]);
                  } 
                }}
              />
              {filteredCars.length > 0 && showDropDown &&search && (
                <ul className={styles["cs-suggestions"]}>
                  {filteredCars.map((c) => (
                    <li
                      key={c.carId}
                      className={styles["cs-suggestion-item"]}
                      onClick={() => handleSelectedCar(c)}
                    >
                      <div className={styles["sug-model"]}>{c.modelName}</div>
                      <div className={styles["sug-meta"]}>{c.company.companyName}  {c.company.companyAddress}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedCar && selectedCarBooking && (
              <div className={styles["cs-order-preview"]}>
                <div className={styles["preview-row"]}><span>🚗 Car</span><span className={styles["preview-value"]}>{selectedCar.modelName}</span></div>
                <div className={styles["preview-row"]}><span>🏢 Company</span><span className={styles["preview-value"]}>{selectedCar.company.companyName}</span></div>
                <div className={styles["preview-row"]}><span>📍 Company address</span><span className={styles["preview-value"]}>{selectedCar.company.companyAddress}</span></div>
                <div className={styles["preview-row"]}><span>👤 User</span><span className={styles["preview-value"]}>{selectedCarBooking.user.firstName} {selectedCarBooking.user.lastName}</span></div>
                <div className={styles["preview-row"]}><span>📞 User phone</span><span className={styles["preview-value"]}>{selectedCarBooking.phone}</span></div>
                <div className={styles["preview-row"]}><span>⏱ Ordered At</span><span className={styles["preview-value"]}>{formatDateTime(selectedCarBooking.bookingTime)}</span></div>
                 <div className={styles["preview-row"]}><span>⏱ Order Activated</span><span className={styles["preview-value"]}>{formatDateTime(selectedCarBooking.rentStart)}</span></div>
                  <div className={styles["preview-row"]}><span>📍 Pickup Address</span><span className={styles["preview-value"]}>{selectedCarBooking.address}</span></div>
              </div>
            )}

            <button
              className={`${styles["cs-btn"]} ${styles["primary"]}`}
              disabled={!selectedCar && !selectedCarBooking}
              onClick={handleSubmit}
            >
              Review Return →
            </button>
          </div>
        )}




       {/* ══════════ CONFIRM + FINE ══════════ */}

       
       {step === STEP.CONFIRM && fineInfo && (
          <div className={styles["cs-section"]}>
            <div className={`${styles["fine-banner"]} ${styles[fineInfo.status]}`}>
              {fineInfo.status === "ontime" ? (
                <>
                  <div className={styles["fine-icon"]}>✅</div>
                  <div className={styles["fine-text"]}>
                    <div className={styles["fine-title"]}>Returned On Time</div>
                    <div className={styles["fine-desc"]}>Within {GRACE_HOURS}h grace period — no charge</div>
                  </div>
                  <div className={`${styles["fine-amount"]} ${styles["free"]}`}>$0</div>
                </>
              ) : (
                <>
                  <div className={styles["fine-icon"]}>🚨</div>
                  <div className={styles["fine-text"]}>
                    <div className={styles["fine-title"]}>{formatLate(fineInfo.minutesLate)}</div>
                    <div className={styles["fine-desc"]}>${selectedCar.pricePerHour}/hr rate applied after {GRACE_HOURS}h grace</div>
                  </div>
                  <div className={`${styles["fine-amount"]} ${styles["danger"]}`}>${fineInfo.fineAmount.toFixed(2)}</div>
                </>
              )}
            </div>

            <button className={`${styles["cs-btn"]} ${styles["primary"]}`} onClick={handleProceed}>
              {hasFine ? "Collect Cash →" : "Confirm Return →"}
            </button>
            <button className={`${styles["cs-btn"]} ${styles["back"]}`} onClick={() => setStep(STEP.SEARCH)}>
              ← Go Back
            </button>
          </div>
        )}

      

        {/* ══════════ CASH CONFIRM + REMIT METHOD ══════════ */}
       
        {step === STEP.CASH && fineInfo && (
          <div className={styles["cs-section"]}>
            <div className={styles["pay-fine-header"]}>
              <div className={styles["pay-fine-icon"]}>💵</div>
              <h2 className={styles["pay-fine-title"]}>
                {hasFine ? "Confirm Cash Collected" : "Confirm Car Received"}
              </h2>
              <p className={styles["pay-fine-sub"]}>
                {hasFine
                  ? "Collect the fine in cash from the customer, then send it to the company."
                  : "Confirm you've physically received the car."}
              </p>
            </div>

            {hasFine && (
              <>
                <div className={styles["pay-fine-card"]}>
                  <div className={`${styles["pay-fine-row"]} ${styles["total"]}`}>
                    <span className={styles["pay-fine-label"]}>💸 Cash Collected</span>
                    <span className={styles["pay-fine-amount"]}>${fineInfo.fineAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className={styles["pm-label"]}>Send to Company Via</div>

                <div className={styles["pay-fine-notice"]}>
                  <span className={styles["notice-icon"]}>🔧</span>
                  <span>Testing mode — select method and confirm to simulate the transfer</span>
                </div>

                <div className={styles["pm-grid"]}>
                  {REMIT_METHODS.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      className={`${styles["pm-card"]} ${remitMethod === m.key ? styles["selected"] : ""}`}
                      onClick={() => { setRemitMethod(m.key); setRemitError(""); }}
                    >
                      {remitMethod === m.key && <div className={styles["pm-check"]}>✓</div>}
                      <div className={`${styles["pm-logo"]} ${styles[m.key]}`}>
                        {m.key === "bkash" ? (
                          <>
                            <span className={styles["pm-logo-b"]}>b</span>
                            <span className={styles["pm-logo-k"]}>Kash</span>
                          </>
                        ) : (
                          <span className={styles["pm-logo-n"]}>N</span>
                        )}
                      </div>
                      <div className={styles["pm-name"]}>{m.label}</div>
                    </button>
                  ))}
                </div>
                {remitError && <div className={styles["cs-error"]}>{remitError}</div>}
              </>
            )}

            <button
              className={`${styles["cs-btn"]} ${styles["pay"]}`}
              disabled={isSubmitting}
              onClick={handlePayment}
            >
              {sendingEmail
                ? "Sending clearance email..."
                : hasFine
                  ? `✓ Confirm Sent via ${remitMethod ? REMIT_METHODS.find(m => m.key === remitMethod)?.label : "..."}`
                  : "✓ Confirm & Send Clearance Email"}
            </button>
            <button
              className={`${styles["cs-btn"]} ${styles["back"]}`}
              disabled={sendingEmail}
              onClick={() => setStep(STEP.CONFIRM)}
            >
              ← Go Back
            </button>
          </div>
        )}

        

        
       {

           (()=>{


              console.log("step " , step);
              console.log("receipt : " , receipt);
              console.log("submitSucessfully : " , submitSucessfully);
              console.log("bookingStatusUpdateSuccessfully : " , bookingStatusUpdateSuccessfully);
              console.log("rentalStatusUpdateSucessfully : " , rentalStatusUpdateSucessfully);
              console.log("finePaidSuccessfully : " , finePaidSuccessfully);


           }) ()
       }

        

        

      
        {step === STEP.RECEIPT && receipt && submitSucessfully && bookingStatusUpdateSuccessfully 
        && rentalStatusUpdateSucessfully && finePaidSuccessfully && (
          <div className={styles["cs-section"]}>
            <div className={styles["receipt"]}>
              <div className={styles["receipt-header"]}>
                <div className={styles["receipt-logo"]}>
                  <span>Drive</span><span className={styles["rx"]}>X</span>
                </div>
                <div className={styles["receipt-tag"]}>SUBMISSION RECEIPT</div>
              </div>
              <div className={`${styles["receipt-divider"]} ${styles["dashed"]}`} />

              <div className={styles["receipt-rows"]}>
                <div className={styles["receipt-row"]}><span>Booking ID</span><span className={styles["receipt-val"]}>#{receipt.bookingId}</span></div>
                <div className={styles["receipt-row"]}><span>Car Model</span><span className={styles["receipt-val"]}>{receipt.modelName}</span></div>
                <div className={styles["receipt-row"]}><span>Company</span><span className={styles["receipt-val"]}>{receipt.companyName}</span></div>
              </div>
              <div className={`${styles["receipt-divider"]} ${styles["dashed"]}`} />

              <div className={styles["receipt-rows"]}>
                <div className={styles["receipt-row"]}><span>Ordered At</span><span className={styles["receipt-val"]}>{formatDateTime(receipt.orderedAt)}</span></div>
                 <div className={styles["receipt-row"]}><span>RentStartTime</span><span className={styles["receipt-val"]}>{formatDateTime(receipt.rentStart)}</span></div>
                <div className={styles["receipt-row"]}><span>Must Return By</span><span className={styles["receipt-val"]}>{formatDateTime(receipt.mustReturnBy)}</span></div>
                <div className={styles["receipt-row"]}><span>Returned At</span><span className={styles["receipt-val"]}>{formatDateTime(receipt.returnedAt)}</span></div>
                <div className={styles["receipt-row"]}><span>Status</span><span className={styles["receipt-val"]}>{formatLate(receipt.minutesLate)}</span></div>
              </div>
              <div className={`${styles["receipt-divider"]} ${styles["dashed"]}`} />

              <div className={styles["receipt-rows"]}>
                <div className={styles["receipt-section-title"]}>💳 Fine Settlement</div>
                <div className={styles["receipt-row"]}>
                  <span>Fine Amount</span>
                  <span className={styles["receipt-val"]}>
                    {receipt.fineAmount === 0 ? "None" : `$${receipt.fineAmount.toFixed(2)}`}
                  </span>
                </div>
                {receipt.remitMethod && (
                  <div className={styles["receipt-row"]}>
                    <span>Sent Via</span>
                    <span className={`${styles["pm-badge-receipt"]} ${styles[receipt.remitMethod]}`}>
                      {receipt.remitMethod === "bkash" ? "bKash" : "Nagad"}
                    </span>
                  </div>
                )}
              </div>
              <div className={`${styles["receipt-divider"]} ${styles["dashed"]}`} />

              <div className={styles["receipt-total-row"]}>
                <span>Total Charged</span>
                <span className={styles["receipt-total-val"]}>
                  {receipt.totalCharged === 0 ? "$0.00" : `$${receipt.totalCharged.toFixed(2)}`}
                </span>
              </div>
              <div className={styles["receipt-divider"]} />

              <div className={styles["receipt-footer"]}>
                <div className={styles["receipt-code"]}>📧 Clearance email sent</div>
                <div className={styles["receipt-date"]}>{formatDate(receipt.returnedAt)}</div>
              </div>
            </div>

            <button className={`${styles["cs-btn"]} ${styles["primary"]}`} onClick={handleReset}>
              Process Another Return
            </button>

            <button className={`${styles["cs-btn"]} ${styles["primary"]}`} onClick={handleDownloadReceipt}>
             ⬇ Download Receipt 
             </button>
          </div>
        )}

  

      </div>
    </div>
  );
}