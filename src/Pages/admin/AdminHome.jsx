import "./CSS/AdminHome.css";
import Navbar from "../Components/Admin/AdminNavbar";
import Sidebar from "../Components/Admin/Sidebar";
import AddCar from "./AddCar";
import { Outlet } from "react-router-dom";

function AdminHome() {
  return (
    <div>
      <div className="navbar"><Navbar/></div>
      <div className="sidebar"><Sidebar/></div>
      <div className="content"><Outlet/></div>
    </div>
  );
}

export default AdminHome;