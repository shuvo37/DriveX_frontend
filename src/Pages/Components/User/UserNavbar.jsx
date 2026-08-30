import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./UserNavbar.css";
import { removeToken  , getEmailFromToken} from "../../../utils/tokenUtils";

import {useNavigate} from "react-router-dom";

import axios from "axios";





export default function UserNavbar() {
  const [activeLink, setActiveLink] = useState("browse");
  const [userFullName , setUserFullName] = useState("");
  const [userEmail] = useState(getEmailFromToken());
  const [user , setUser] = useState(null);
   const navigate = useNavigate();




 useEffect(()=>{


   const fetchUser = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/auth/get-user-by-email` ,{

          params:{

             email:userEmail 

          }


      });
      setUser(response.data);
      setUserFullName(`${response.data.firstName} ${response.data.lastName}`);
    } catch (err) {
      if (err.response) {
        console.log("err inside fetch user in navbar", err.response.data);
      } else {
        console.log("network error");
      }
    }
  };

  fetchUser();

 } , [])



  const navItems = [
    { key: "browse",     label: "🚗 Browse Cars",    path: "/user-home"            },
    { key: "about",      label: "ℹ️ About Us",       path: ""       },
    { key: "contact",    label: "📞 Contact Us",     path: ""     },
    {key : "logout" ,    label: "⏻ LogOut",      path:"/"}
  ];


  const handleNavClick = (key) => {
  if (key === "logout") {
    removeToken();
    return;
  }
  setActiveLink(key);
};


 const initial_avatar = user && userFullName ? userFullName.charAt(0).toUpperCase() : "UN";


  return (
    <nav className="user-navbar">

    
      <div className="user-nav-logo" onClick={()=>navigate("/login")}>
        <span className="user-logo-drive">Drive</span>
        <span className="user-logo-x">X</span>
      </div>

  <ul className="user-nav-links">
  {navItems.map((item) => (
    <li key={item.key}>
      {item.path ? (
        <Link
          to={item.path}
          className={`user-nav-link ${activeLink === item.key ? "user-active" : ""}`}
          onClick={() => handleNavClick(item.key)}
        >
          {item.label}
        </Link>
      ) : (
        <span
          className="user-nav-link"
        >
          {item.label}
        </span>
      )}
    </li>
  ))}
</ul>

      <div className="profile-layout">


           <div className = "user-navbar-avatar" onClick={()=>navigate("profile")}>
              {
                user?.profileImage?

                 <img src = {user.profileImage} alt = "profile"
                 
                 style={{width:"100%" , height:"100%" , borderRadius: "50%",objectFit: "cover"}}/>

                : initial_avatar



              }

           </div>

      </div>





    </nav>
  );
}