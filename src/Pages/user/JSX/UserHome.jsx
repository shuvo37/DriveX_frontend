
import Navbar from "../../Components/User/UserNavbar";
import CarAssistant from "../../Components/User/CarAssistant";
import CarShowcase from "./CarShowcase";
import "../CSS/UserHome.css";
import { Outlet } from "react-router-dom";

function UserHome()
{

return(
   <div>
  
   <Navbar/>
   <Outlet/>       
   <CarAssistant/>
   
   </div>
);
}

export default UserHome;
