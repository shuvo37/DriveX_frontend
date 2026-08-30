import { useState, useRef  , useEffect} from "react";
import styles from "../CSS/profile.module.css";
import axios from "axios";
import { getEmailFromToken } from "../../../utils/tokenUtils";
import Payment from './Payment';


function bytesToSrc(base64) {
  if (!base64) return null;
  return `data:image/jpeg;base64,${base64}`;
}

function normalizeStatus(status) {
  if (!status) return "inActive";
  switch (status.toUpperCase()) {
    case "SUBMITTED": return "completed";
    case "ONGOING":    return "active";
    case "NOT_DELIVERED": return "inActive";
    default:          return "inActive";
  }
}

function normalizeMethod(method) {
  if (!method) return "—";
  switch (method.toUpperCase()) {
    case "BKASH": return "bKash";
    case "NAGAD": return "Nagad";
    default:      return method;
  }
}

export default function Profile() {
  const [user , setUser] = useState(null);
  const [avatarSrc, setAvatarSrc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [userBookings , setUserBookings] = useState([]);
  const [activeBooking , setActiveBooking] = useState([]);
  const [imageFile, setImageFile] = useState(null);



  
  const userEmail = getEmailFromToken();

  const fileRef = useRef();

  

   useEffect(()=>{

      axios.get("http://localhost:8080/api/booking/all-booking-by-email" , {

         params : {

           email:userEmail

         }

      }).then((userBooking)=>{


         const userBookingData = userBooking.data;

         setActiveBooking(userBookingData.filter((booking)=> booking.bookingStatus == "ONGOING"));

         setUserBookings(userBookingData);


      }).catch((err)=>{

            if(err.response)
            {

              console.log("err insode all-booking-by-email " , err.response.data);

            }
            else{

                console.log("netwoek error");
            }


      })

   } , [])


   useEffect(()=>{


      axios.get("http://localhost:8080/api/auth/get-user-by-email" , {

          params:{

            email:userEmail

          }

      }).then((getUser)=>{


          const userData = getUser.data;

          setUser(userData);

          if(userData.profileImage)
          {
             setAvatarSrc(userData.profileImage);
          }

      }).catch((err)=>{


          if(err.response)
          {

             console.log("err inside get-user-by-email " , err.response.data);
          }
          else{

              console.log("network error inside get-user-by-email");
          }

      })

   } , []);


    const getImageUrl = async (file) => {
       
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post("http://localhost:8080/api/images/upload", formData);
  return response.data;
};


  // Local-only preview, no upload call
  const handleAvatarChange = async(e) => {


    const file = e.target.files[0];
    
    if (!file) return;
   

    setUploading(true);

    if (file) {
      setImageFile(file);
      setAvatarSrc(URL.createObjectURL(file));
    }

  


    try{

        const ImageUrl = await getImageUrl(file);


        const  response = await axios.post("http://localhost:8080/api/images/upload-image",{} ,  {

          params:
          {
              
             imageUrl : ImageUrl,
             email    : userEmail

          }

        })

        setUser((prev)=>({...prev , profileImage:ImageUrl}));

        setAvatarSrc(ImageUrl);

    }catch(err)
    {

        if(err.response)
        {

            console.log("error inside uploadImage" , err.response.data)
        }
        else{
           console.log("network error")
        }

    }finally
    {

      setUploading(false);
    }
  

  };



  const fullName =user ? `${user.firstName} ${user.lastName}`:"";
  const initials = user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase():"";

  return (
    <div className={styles["prof-root"]}>
      <div className={styles["prof-layout"]}>

        {/* ══════════ LEFT PANEL ══════════ */}
        <div className={styles["prof-left"]}>

          {/* Avatar */}
          <div className={styles["avatar-section"]}>
            <div className={styles["avatar-wrap"]} onClick={() => fileRef.current.click()}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" className={styles["avatar-img"]} />
                : <div className={styles["avatar-initials"]}>{initials}</div>
              }
              <div className={styles["avatar-overlay"]}>
                <span className={styles["avatar-camera"]}>{uploading ? "⏳" : "📷"}</span>
                <span className={styles["avatar-overlay-text"]}>{uploading ? "Saving..." : "Change"}</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*"
              style={{ display: "none" }} onChange={handleAvatarChange} />
            <div className={styles["avatar-name"]}>{fullName}</div>
            <div className={styles["avatar-email"]}>{user?.email}</div>
          </div>

          {/* Stats */}
          <div className={styles["stats-row"]}>
            <div className={styles["stat-box"]}>
              <div className={`${styles["stat-num"]} ${styles["active-num"]}`}>{activeBooking.length}</div>
              <div className={styles["stat-lbl"]}>Active Order</div>
            </div>
          </div>

        </div>

        {/* ══════════ RIGHT PANEL ══════════ */}
        <div className={styles["prof-right"]}>

          {/* ── Transaction History ── */}
          <div className={styles["prof-section"]}>
            <div className={styles["prof-section-header"]}>
              <div className={styles["prof-section-title"]}>📑 Booking History</div>
              <div className={styles["txn-count"]}>{userBookings.length} bookings</div>
            </div>

            {userBookings.length === 0 ? (
              <div className={styles["txn-empty"]}>No bookings yet.</div>
            ) : (
              <div className={styles["txn-list"]}>
                {userBookings.map((book) => {
                  const status = normalizeStatus(book.bookingStatus);
                  console.log(`car model ${book.car.modelName} status ${status}`);
                  return (
                    <div key={book.bookingId} className={`${styles["txn-row"]} ${styles[status]}`}>
                      <div className={styles["txn-left"]}>
                        <div className={styles["txn-car"]}>{book.car.modelName}</div>
                        <div className={styles["txn-meta"]}>
                          <span className={styles["txn-id"]}>{book.bookingId}</span>
                          <span className={styles["txn-dot"]}>·</span>
                          <span>
                            {book.bookingTime
                              ? new Date(book.bookingTime).toLocaleDateString("en-GB", {
                                  day: "2-digit", month: "short", year: "numeric",
                                })
                              : "—"}
                          </span>
                          <span className={styles["txn-dot"]}>·</span>
                          <span>{book.totalHours}h</span>
                          <span className={styles["txn-dot"]}>·</span>
                          <span>{normalizeMethod(book.payment.paymentMethod)}</span>
                        </div>
                      </div>
                      <div className={styles["txn-right"]}>
                        <div className={styles["txn-amount"]}>${book.totalprice.toFixed(2)}</div>
                        <div className={`${styles["txn-status"]} ${styles[status]}`}>
                          {status === "completed" ? "✓ Completed"
                            : status === "active"  ? "● Active"
                            : "inActive"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
