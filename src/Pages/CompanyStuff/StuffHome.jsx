import { DiVim } from "react-icons/di";
import StuffNavbar from "../Components/Stuff/StuffNavbar";
import { Outlet } from "react-router-dom";

function StuffHome(){


 return(

     <div>

      <StuffNavbar/>
        <Outlet/>
     </div>



 )


}
export default StuffHome;