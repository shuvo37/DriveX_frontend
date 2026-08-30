import { useState } from "react";
import { Link } from "react-router-dom";
import "./AdminNavbar.css";

export default function AdminNavbar() {
  const [activeLink, setActiveLink] = useState("");

  const navItems = [
    { key: "StartRent",     label: "🔍 ONGOING CAR",    path: "search-ongoing-car"},
     { key: "SubmitCar",     label: "🔄 Update Role",    path: "role-update"},
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


  return (
    <nav className="stuff-navbar">

    
      <div className="stuff-nav-logo">
        <span className="stuff-logo-drive">Drive</span>
        <span className="stuff-logo-x">X</span>
      </div>

    
      <ul className="stuff-nav-links">
        {navItems.map((item) => (
          <li key={item.key}>
            <Link
              to={item.path}
              className={`stuff-nav-link ${activeLink === item.key ? "stuff-active" : ""}`}
              onClick={() => handleNavClick(item.key)}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

    </nav>
  );
}
