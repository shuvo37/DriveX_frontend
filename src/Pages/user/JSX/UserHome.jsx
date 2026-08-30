
import Navbar from "../../Components/User/UserNavbar";
import CarShowcase from "./CarShowcase";
import "../CSS/UserHome.css";
import { Outlet } from "react-router-dom";

function UserHome()
{

return(
   <div>
  
   <Navbar/>
   <Outlet/>       
   
   </div>
);
}

export default UserHome;