
import { BrowserRouter , Routes , Route } from "react-router-dom"
import ProtectedRoute from "./Pages/Components/Admin/ProtectedRoute.jsx"
import OAuth2callback from "./Pages/Auth/OAuth2callback"
import CompleteProfile from "./Pages/Auth/CompleteProfile"
import AddCompany from "./Pages/admin/AddCompany"
import UpdateCompany from "./Pages/admin/UpdateCompany"
import AddCar from "./Pages/admin/AddCar"
import UpdateCar from "./Pages/admin/UpdateCar.jsx";
import CarActiveStatus from "./Pages/admin/CarActiveStatus.jsx";
import CompanyActiveStatus from "./Pages/admin/CompanyActiveStatus.jsx";
import AdminHome from "./Pages/admin/AdminHome";
import CarShowcase from "./Pages/user/JSX/CarShowcase.jsx";
import UserHome from "./Pages/user/JSX/UserHome.jsx";
import UserNavbar from "./Pages/Components/User/UserNavbar.jsx";
import Payment from "./Pages/user/JSX/Payment.jsx";
import Login from "./Pages/generalPages/Login.jsx";
import Register from "./Pages/generalPages/Register.jsx";
import CarSubmission from "./Pages/CompanyStuff/CarSubmission.jsx"
import CarRentTimeStart from "./Pages/CompanyStuff/CarRentTimeStart.jsx"
import Profile from "./Pages/user/JSX/Profile.jsx"
import RoleUpdate from "./Pages/admin/RoleUpdate.jsx";
import SearchBookingCar from "./Pages/admin/SearchBookingCar.jsx";
import StuffHome from "./Pages/CompanyStuff/StuffHome.jsx"
import ForgotPassword from "./Pages/generalPages/ForgotPassword.jsx"




function App() {
  return (
    <div>
         <BrowserRouter>
         
          <Routes>

            <Route path = "/register" element = {<Register/>}/>

            <Route path ="/" element = {<Login/>}></Route>

            <Route path = "/forget-password" element = {<ForgotPassword/>}/>

            <Route path="/user-home"  element = {<ProtectedRoute allowAble={["USER"]}><UserHome/></ProtectedRoute>}>

               <Route index element = {<CarShowcase/>}/> 

              <Route path = "payment" element = {<Payment/>}/>

              <Route path = "profile" element = {<Profile/>}/>

            </Route>




            <Route path = "/stuff-home" element = {<ProtectedRoute allowAble={["ADMIN" , "STUFF"]}><StuffHome/></ProtectedRoute>}>

            <Route index element = {<ProtectedRoute allowAble={["ADMIN" , "STUFF"]}><CarRentTimeStart/></ProtectedRoute>}/>

            <Route path = "car-submission"  element = {<ProtectedRoute allowAble={["ADMIN" , "STUFF"]}><CarSubmission/></ProtectedRoute>}/>

             
            </Route>

            

            <Route path = "/home-admin"  element = {<AdminHome/>}>

               <Route index element={<AddCar />}/>

               <Route path = "add-company" element = {<AddCompany/>}/>

              <Route path = "update-company" element = {<UpdateCompany/>}/>

              <Route path = "company-active-status" element = {<CompanyActiveStatus/>}/>

              <Route path = "add-car" element = {<AddCar/>}/>

              <Route path = "update-car" element = {<UpdateCar/>}/>

              <Route path = "car-active-status" element = {<CarActiveStatus/>}/>

              <Route path = "role-update" element = {<ProtectedRoute  allowAble = {"ADMIN"}><RoleUpdate/></ProtectedRoute>}/>
              <Route path = "search-ongoing-car" element = {<ProtectedRoute  allowAble = {"ADMIN"}><SearchBookingCar/></ProtectedRoute>}/>
          
           </Route>

             <Route path = "/update-car" element = {<UpdateCar/>}/>

              <Route path="/oauth2/callback" element={<OAuth2callback/>} />

              <Route path="/complete-profile" element={<CompleteProfile />} />
          
          </Routes>
         
         
         </BrowserRouter>
    
    
    </div>
  )
}

export default App