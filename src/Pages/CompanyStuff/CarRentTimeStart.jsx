import { useEffect, useState } from "react";
import styles from "./CarRentTimeStart.module.css";
import axios from "axios";
import Switch from "react-switch";


function CarRentTimeStart() {


  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [allCars , setAllCars] = useState([]);
  const [booking  , setBooking] = useState(null);
  const [errors , setErrors] = useState(null);
  const [working , setWorking] = useState(false);


  useEffect(()=>{


      axios.get("http://localhost:8080/api/booking/get-all-not_delivered_car")
         .then((carRes)=>{


             const cars = carRes.data;

             setAllCars(cars);


         })
         .catch((err) => {

            if(err.response)
             {

                console.log(" inside all get all car " , err.response.data);
                
                setErrors((prev)=>({...prev , readCar:err.response.data.message}));

             }
             else if(err.request)
             {

                console.log("network error  inside all get all car");
                setErrors((prev)=>({...prev , readCar:"network error"}));

             }
             else{

                 console.log("other error inside all get all car ");

                 setErrors((prev)=>({...prev , readCar:err.message}));
                  
             }
         })
        

  } , [])



  const getBookingOfCar = async( modelName) =>{


       
       setWorking(true);
       
       try {

         const payload = {

            "modelName": modelName

         }


         const response = await axios.post("http://localhost:8080/api/booking/get-all-bookings-not_delivered" , payload);

         return response.data;

        
       } catch (err) {

            if(err.response)
             {

                console.log("inside get booking of car" ,err.response.data);
                
                setErrors((prev)=>({...prev , readbooking:err.response.data.message}));

             }
             else if(err.request)
             {

                console.log("network error inside get booking of car");
                setErrors((prev)=>({...prev  , readbooking:"network error"}));

             }
             else{

                 console.log("other error inside get booking of car");

                 setErrors((prev)=>({...prev , readbooking:err.message}));
                  
             }
          
        
       }

       finally {
        
        setWorking(false);

        }



  }

  const setBookingRentStartTime = async(bookingId) =>
  {

    bookingId = Number(bookingId);

      

       try{

          
         const response = await axios.patch(`http://localhost:8080/api/booking/set-rent-start-time/${bookingId}`);

         return response.data;

       }
       catch(err)
       {


             if(err.response)
             {

                console.log("inside setBookingRentStartTime " ,err.response.data);
                
                setErrors((prev)=>({...prev , setRentStartTime:err.response.data.message}));

             }
             else if(err.request)
             {

                console.log("network error setBookingRentStartTime ");
                setErrors((prev)=>({...prev  , setRentStartTime:"network error"}));

             }
             else{

                 console.log("other error inside setBookingRentStartTime ");

                 setErrors((prev)=>({...prev , setRentStartTime:err.message}));
                  
             }


       }


  }



  const setBookingRentEndTime = async(bookingId) =>
  {

     bookingId = Number(bookingId);

       try{

          
         const response = await axios.patch(`http://localhost:8080/api/booking/set-rent-end/${bookingId}`);

         return response.data;

       }
       catch(err)
       {


             if(err.response)
             {

                console.log("inside setBookingRentEndTime  " ,err.response.data);
                
                setErrors((prev)=>({...prev , setRentEndTime:err.response.data.message}));

             }
             else if(err.request)
             {

                console.log("network error setBookingRentEndTime  ");
                setErrors((prev)=>({...prev  , setRentEndTime:"network error"}));

             }
             else{

                 console.log("other error inside setBookingRentEndTime  ");

                 setErrors((prev)=>({...prev , setRentEndTime:err.message}));
                  
             }


       }


  }




const handleToggle = async () => {

    let requireTime  , currTime;

    setWorking(true);

    if(booking.rentStart)
    {

         requireTime = new Date(booking.rentStart).getTime() + booking.totalHours*60*60*1000;

         currTime = Date.now();

    }

  if (!booking.toggle) {
    const updatedBooking = await setBookingRentStartTime(booking.bookingId);
    setBooking(updatedBooking);
    console.log(updatedBooking);
  } else if(requireTime - currTime < 0 && booking.toggle) {
    const updatedBooking = await setBookingRentEndTime(booking.bookingId);
    setBooking(updatedBooking);
    console.log(updatedBooking);
  }

    setTimeout(() => { setWorking(false) }, 1000);

};








  const filtered = allCars.filter((b) =>
    b.modelName.toLowerCase().includes(search.toLowerCase())
  );




  const handleSelect = async (car) => {


    setSearch(car.modelName);

     const getBooking = await getBookingOfCar(car.modelName);
    
     console.log("cars booking " , getBooking);

     setBooking(getBooking);

  };






  return (
    <div className={styles.page}>
      <div className={styles.delete_wrapper}>
        {/* ── Left: Search + Suggestions ── */}
        <div className={styles.car_list_card}>
          <h3>Search Car Model</h3>
          <input
            className={styles.search_input}
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
          <div className={styles.car_list}>
            {filtered.length === 0 && (
              <p className={styles.no_result}>No cars found</p>
            )}
            {search &&filtered.map((car) => (
              <div
                key={car.carId}
                className={`${styles.car_item} ${
                  booking?.car.carId === car.carId ? styles.active : ""
                }`}
                onClick={() => handleSelect(car)}
              >
                <div className={styles.car_avatar}>🚗</div>
                <div className={styles.car_item_info}>
                  <p className={styles.car_item_name}>{car.modelName}</p>
                  <p className={styles.car_item_company}>
                    {car.company.companyName}
                  </p>
                </div>
                <span
                  className={`${styles.car_status_badge} ${
                       styles.status_rented
                  }`}
                >
                  <span className={styles.status_dot}></span>
                  {car.rentalStatus.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Detail Panel ── */}
        <div className={styles.form_card}>
          {!booking && (
            <div className={styles.empty_state}>
              <div className={styles.empty_icon}>🚗</div>
              <h3>No Car Selected</h3>
              <p>Pick a car from the left to view its booking</p>
            </div>
          )}

          {booking && (
            <>
              <div className={styles.form_header}>
                <img
                  src={booking.car.imageUrl}
                  alt={booking.car.modelName}
                  className={styles.car_image}
                />
                <div>
                  <h2>{booking.car.modelName}</h2>
                  <p>{booking.car.company.companyName}</p>
                </div>
              </div>

              <div className={styles.info_grid}>
                <div className={styles.info_item}>
                  <span className={styles.info_label}>Customer</span>
                  <span className={styles.info_value}>
                    {booking.user.firstName} {booking.user.lastName}
                  </span>
                </div>
                <div className={styles.info_item}>
                  <span className={styles.info_label}>Phone</span>
                  <span className={styles.info_value}>{booking.phone}</span>
                </div>
                <div className={styles.info_item}>
                  <span className={styles.info_label}>Address</span>
                  <span className={styles.info_value}>{booking.address}</span>
                </div>
                <div className={styles.info_item}>
                  <span className={styles.info_label}>Booked Hours</span>
                  <span className={styles.info_value}>{booking.totalHours} hr</span>
                </div>
                <div className={styles.info_item}>
                  <span className={styles.info_label}>Total Price</span>
                  <span className={styles.info_value}>${booking.totalprice}</span>
                </div>
                <div className={styles.info_item}>
                  <span className={styles.info_label}>Booking Status</span>
                  <span className={styles.info_value}>{booking.bookingStatus}</span>
                </div>
              </div>

              <div className={styles.toggle_box}>
                <div>
                  <p className={styles.toggle_label}>
                    {booking?.toggle? "Trip Running" : "Not Handed Over"}
                  </p>
                  <p className={styles.toggle_sublabel}>
                    {booking?.toggle?
                       "Timer is active — toggle off to end the trip"
                      : "Toggle on to hand over the car and start the timer"}
                  </p>
                </div>

                    <Switch
                        checked={booking? booking.toggle:false}
                        onChange={handleToggle}
                        disabled = {working}
                        onColor="#52b788"
                        offColor="#e63946"
                        height={26}
                        width={46}
                        checkedIcon={false}
                        uncheckedIcon={false}
                    />
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CarRentTimeStart;
