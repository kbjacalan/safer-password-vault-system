import { useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { PackageSearch, PackagePlus, Menu } from "lucide-react";
import { useSidebar } from "../../providers/SidebarProvider";
import Logo from "../../assets/logo.png";
import "./Sidebar.css";

const USER_NAV = [
  { to: "/my-vault", icon: PackageSearch, label: "My Vault" },
  { to: "/add-password", icon: PackagePlus, label: "Add Password" },
];

const Sidebar = () => {
  const { isOpen, toggle, close } = useSidebar();
  const sidebarRef = useRef(null);
  const hamburgerRef = useRef(null);

  const handleNavClick = () => {
    if (window.innerWidth <= 825) close();
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        window.innerWidth <= 825 &&
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !hamburgerRef.current.contains(e.target)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, close]);

  return (
    <>
      <button
        ref={hamburgerRef}
        className="sidebar-hamburger"
        onClick={toggle}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <Menu size={18} />
      </button>

      <aside
        ref={sidebarRef}
        className={`sidebar ${isOpen ? "sidebar--open" : "sidebar--closed"}`}
      >
        <div className="sidebar-brand">
          <img src={Logo} className="brand-logo" alt="Safer Logo" />
          <div className="brand-text">
            <p className="brand-name">Safer</p>
            <span className="brand-tagline">Password Vault</span>
          </div>
        </div>

        <div className="sidebar-divider" />

        <p className="sidebar-section-label">Main Menu</p>

        <nav className="sidebar-nav">
          {USER_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={handleNavClick}
            >
              <span className="item-icon">
                <Icon size={18} />
              </span>
              <span className="item-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
