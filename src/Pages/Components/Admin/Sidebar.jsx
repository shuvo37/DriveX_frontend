import { useState } from "react";
import { Link } from "react-router-dom"; // 👈 import Link
import {
  HiOfficeBuilding, HiTruck, HiStar, HiCog,
  HiPlusCircle, HiTrash, HiPencilAlt, HiTag,
  HiClock, HiRefresh, HiThumbUp,
  HiMoon, HiAdjustments, HiChevronDown,
} from "react-icons/hi";

import "./Sidebar.css";
import AddCar from "../../admin/AddCar";
import UpdateCar from "../../admin/UpdateCar";
import carActiveStatus from "../../admin/CarActiveStatus";
import AddCompany from  "../../admin/AddCompany";
import UpdateCompany from  "../../admin/UpdateCompany";
import CompanyActiveStatus from "../../admin/CompanyActiveStatus";


const menuItems = [
  {
    label: "Company",
    icon: <HiOfficeBuilding />,
    children: [
      { label: "Add Company",          icon: <HiPlusCircle />, path: "add-company" },   // 👈 path added
      { label: "Delete Company",       icon: <HiTrash />,      path: "company-active-status" },
      { label: "Update Company",  icon: <HiPencilAlt />,  path: "update-company" },
    ],
  },
  {
    label: "Car Management",
    icon: <HiTruck />,
    children: [
      { label: "Add New Car",     icon: <HiTag />,    path: "add-car" },
      { label: "Delete Car Info", icon: <HiClock />,  path: "car-active-status" },
      { label: "Update Car Info", icon: <HiRefresh />, path: "update-car" },
    ],
  },

  {
    label: "Settings",
    icon: <HiCog />,
    children: [
    ],
  },
];

function CollapseMenu({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="menu-group">
      <button className="menu-btn" onClick={() => setOpen(!open)}>
        <span className="menu-icon">{item.icon}</span>
        <span className="menu-label">{item.label}</span>
        <span className={`chevron ${open ? "open" : ""}`}>
          <HiChevronDown />
        </span>
      </button>

      {open && (
        <div className="submenu">
          {item.children.map((child) => (
            <Link to={child.path} className="submenu-item" key={child.label}> {/* 👈 Link instead of <a> */}
              <span className="submenu-icon">{child.icon}</span>
              <span>{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">

      <nav className="menu">
        {menuItems.map((item) => (
          <CollapseMenu key={item.label} item={item} />
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;